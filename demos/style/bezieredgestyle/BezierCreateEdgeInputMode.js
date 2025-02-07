/****************************************************************************
 ** @license
 ** This demo file is part of yFiles for HTML 2.5.
 ** Copyright (c) 2000-2023 by yWorks GmbH, Vor dem Kreuzberg 28,
 ** 72070 Tuebingen, Germany. All rights reserved.
 **
 ** yFiles demo files exhibit yFiles for HTML functionalities. Any redistribution
 ** of demo files in source code or binary form, with or without
 ** modification, is not permitted.
 **
 ** Owners of a valid software license for a yFiles for HTML version that this
 ** demo is shipped with are allowed to use the demo source code as basis
 ** for their own yFiles for HTML powered applications. Use of such programs is
 ** governed by the rights and conditions as set out in the yFiles for HTML
 ** license agreement.
 **
 ** THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESS OR IMPLIED
 ** WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 ** MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN
 ** NO EVENT SHALL yWorks BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 ** SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 ** TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 ** PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 ** LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 ** NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 ** SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **
 ***************************************************************************/
import {
  BendEventArgs,
  BezierEdgeStyle,
  CreateEdgeInputMode,
  DefaultBendCreator,
  IBend,
  IBendCreator,
  ICanvasObject,
  IEdge,
  IGraph,
  IHitTestable,
  IInputModeContext,
  ILookup,
  InputModeEventArgs,
  IPortCandidate,
  ItemEventArgs,
  OrthogonalEdgeEditingPolicy,
  Point,
  SimpleEdge
} from 'yfiles'

/**
 * Custom create edge input mode for bezier edges.
 * This mode can operate in two different ways:
 * If {@link BezierCreateEdgeInputMode.createSmoothSplines} is `true`, you create only
 * the exterior control points and the mode interpolates the missing middle control point for each
 * triple.
 * Otherwise, you specify each control point exactly as intended.
 * During the gesture, the current hull curve is shown.
 */
export class BezierCreateEdgeInputMode extends CreateEdgeInputMode {
  /**
   * Determines whether we want to create smooth splines.
   * If true, each "bend" creation inserts one of the "exterior" control points for a cubic segment, and the point in the middle
   * is created automatically by the mode. Otherwise, each control point must be explicitly created.
   * Default value is true.
   * @type {boolean}
   */
  get createSmoothSplines() {
    return this.$createSmoothSplines
  }

  /**
   * Specifies whether we want to create smooth splines.
   * If true, each "bend" creation inserts one of the "exterior" control points for a cubic segment, and the point in the middle
   * is created automatically by the mode. Otherwise, each control point must be explicitly created.
   * Default value is true.
   * @type {boolean}
   */
  set createSmoothSplines(value) {
    this.$createSmoothSplines = value
  }

  constructor() {
    super()
    // Whether we want to create smooth splines.
    this.$createSmoothSplines = true
    // By default, we can't create orthogonal edges with this mode
    // (what would that look like)
    this.orthogonalEdgeCreation = OrthogonalEdgeEditingPolicy.NEVER

    // Re-entrance flag when we are inserting/removing dummy edge bends.
    this.augmenting = false
    // Additional canvas object that highlights the control point sequence.
    this.controlPointHighlight = null

    this.validBendHitTestable = IHitTestable.create((context, location) => {
      if (
        !this.dummyEdge ||
        !(this.dummyEdge.style instanceof BezierEdgeStyle) ||
        !this.createSmoothSplines
      ) {
        return true
      }
      const lastBend = this.dummyEdge.bends.at(-1)
      if (!lastBend) {
        return true
      }
      // Require a minimum length for the control point triple
      return (
        lastBend.index % 3 !== 1 || location.subtract(lastBend.location.toPoint()).vectorLength > 10
      )
    })
  }

  /**
   * If we have a bezier edge style, we decorate it so that we can also show the control points.
   * A better solution that would however be more involved would be to show the decoration.
   * @returns {!IEdge}
   */
  createDummyEdge() {
    const dummyEdge = super.createDummyEdge()
    const simpleEdge = dummyEdge
    if (dummyEdge instanceof SimpleEdge && dummyEdge.style instanceof BezierEdgeStyle) {
      // By default, the BezierEdgeStyle has no bend creator
      // However, we want to be able to create bends here
      // So we sneakily insert a BendCreator into the dummy edge lookup
      const oldLookup = simpleEdge.lookupImplementation
      simpleEdge.lookupImplementation = ILookup.createCascadingLookup(
        oldLookup,
        ILookup.createSingleLookup(new DefaultBendCreator(), IBendCreator.$class)
      )
    }

    return dummyEdge
  }

  /**
   * @param {!InputModeEventArgs} inputModeEventArgs
   */
  onGestureCanceling(inputModeEventArgs) {
    if (this.controlPointHighlight) {
      this.controlPointHighlight.remove()
      this.controlPointHighlight = null
    }
    super.onGestureCanceling(inputModeEventArgs)
  }

  /**
   * @param {!InputModeEventArgs} inputModeEventArgs
   */
  onGestureFinishing(inputModeEventArgs) {
    if (this.controlPointHighlight) {
      this.controlPointHighlight.remove()
      this.controlPointHighlight = null
    }
    super.onGestureFinishing(inputModeEventArgs)
  }

  /**
   * @param {!IInputModeContext} context
   */
  uninstall(context) {
    if (this.controlPointHighlight) {
      this.controlPointHighlight.remove()
      this.controlPointHighlight = null
    }
    super.uninstall(context)
  }

  /**
   * @returns {!IGraph}
   */
  createDummyEdgeGraph() {
    const dummyGraph = super.createDummyEdgeGraph()
    // Register to bend creation and removal events
    // in order to insert additional bends in the middle of a line segment
    // or remove them if the defining bend is removed
    dummyGraph.addBendAddedListener(this.onBendAdded.bind(this))
    dummyGraph.addBendRemovedListener(this.onBendRemoved.bind(this))
    return dummyGraph
  }

  /**
   * @param {!object} sender
   * @param {!BendEventArgs} args
   */
  onBendRemoved(sender, args) {
    if (!this.augmenting) {
      if (this.createSmoothSplines && this.dummyEdge.style instanceof BezierEdgeStyle) {
        this.augmenting = true
        try {
          if (this.dummyEdge.bends.size > 0 && this.dummyEdge.bends.size % 3 === 0) {
            // Undo bend creation that finished a triple
            this.dummyEdgeGraph.remove(this.dummyEdge.bends.last())
          }
        } finally {
          this.augmenting = false
        }
      }
    }
  }

  /**
   * @param {!object} sender
   * @param {!ItemEventArgs.<IBend>} args
   */
  onBendAdded(sender, args) {
    if (!this.augmenting) {
      if (this.createSmoothSplines && this.dummyEdge.style instanceof BezierEdgeStyle) {
        this.augmenting = true
        try {
          if (this.dummyEdge.bends.size % 3 === 0) {
            // Bend creation that finishes a control point line
            // Insert a middle bend
            const cp0 = this.dummyEdge.bends.get(this.dummyEdge.bends.size - 2).location.toPoint()
            const cp2 = args.item.location.toPoint()
            const cp1 = cp2.subtract(cp0).multiply(0.5).add(cp0)
            this.dummyEdgeGraph.addBend(this.dummyEdge, cp1, this.dummyEdge.bends.size - 1)
          }
        } finally {
          this.augmenting = false
        }
      }
    }
  }

  /**
   * Overridden to pad the number of bends so that there are always 2 mod 3 by duplicating the last location, if necessary.
   * @param {!IGraph} graph
   * @param {!IPortCandidate} sourcePortCandidate
   * @param {!IPortCandidate} targetPortCandidate
   * @returns {?(IEdge|Promise.<IEdge>)}
   */
  createEdge(graph, sourcePortCandidate, targetPortCandidate) {
    if (this.createSmoothSplines && this.dummyEdge.style instanceof BezierEdgeStyle) {
      if (this.dummyEdge.bends.size > 0) {
        this.augmenting = true
        try {
          const lastLocation = this.dummyEdge.bends.last().location.toPoint()
          if (this.dummyEdge.bends.size % 3 === 1) {
            // We can reach this branch if we finish the edge creation
            // without having finished a control point triple
            // Just duplicate the last bend
            this.dummyEdgeGraph.addBend(this.dummyEdge, lastLocation)
          } else if (this.dummyEdge.bends.size % 3 === 0) {
            // Actually, we shouldn't be able to come here
            // since we always create bend triples and have an initial single control point
            this.dummyEdgeGraph.addBend(this.dummyEdge, lastLocation)
            this.dummyEdgeGraph.addBend(this.dummyEdge, lastLocation)
          }
        } finally {
          this.augmenting = false
        }
      }
    }
    return super.createEdge(graph, sourcePortCandidate, targetPortCandidate)
  }
}
