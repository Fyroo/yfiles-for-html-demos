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
  Class,
  ICanvasContext,
  IFocusIndicatorInstaller,
  IInputModeContext,
  INode,
  IRectangle,
  IRenderContext,
  ISelectionIndicatorInstaller,
  NodeStyleBase,
  PatternFill,
  Point,
  Rect,
  RectangleIndicatorInstaller,
  Size,
  SvgVisual,
  Visual
} from 'yfiles'

/**
 * A node style for activity nodes that renders lead and followUp time.
 */
export default class ActivityNodeStyle extends NodeStyleBase {
  color: string
  fillColor: string
  patternFill: PatternFill

  constructor(color: { r: number; g: number; b: number }) {
    super()
    this.color = `rgb(${color.r},${color.g},${color.b})`
    this.fillColor = `rgba(${color.r},${color.g},${color.b},0.8)`
    this.patternFill = this.createPatternFill(this.color)
  }

  /**
   * Creates the visualization for the given node.
   * @param context The render context.
   * @param node The node to which this style instance is assigned.
   */
  createVisual(context: IRenderContext, node: INode): SvgVisual {
    // get the activity data
    const tag = node.tag
    const layout = node.layout

    // create the container element
    const container = document.createElementNS('http://www.w3.org/2000/svg', 'g')

    // get the width of the lead an followUp decorations
    const leadWidth: number =
      typeof tag.leadTimeWidth === 'number' && tag.leadTimeWidth > 0 ? tag.leadTimeWidth : 0
    const followUpWidth: number =
      typeof tag.followUpTimeWidth === 'number' && tag.followUpTimeWidth > 0
        ? tag.followUpTimeWidth
        : 0

    const rectWidth = layout.width + leadWidth + followUpWidth
    const rectX = -leadWidth

    const halfHeight = layout.height * 0.5

    // create the background rectangle
    const backgroundRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    backgroundRect.width.baseVal.value = rectWidth
    backgroundRect.height.baseVal.value = layout.height
    backgroundRect.rx.baseVal.value = halfHeight
    backgroundRect.ry.baseVal.value = halfHeight
    SvgVisual.setTranslate(backgroundRect, rectX, 0)
    backgroundRect.setAttribute('fill', '#fff')
    container.appendChild(backgroundRect)

    // create the main rectangle
    const mainRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    mainRect.width.baseVal.value = rectWidth
    mainRect.height.baseVal.value = layout.height
    mainRect.rx.baseVal.value = halfHeight
    mainRect.ry.baseVal.value = halfHeight
    SvgVisual.setTranslate(mainRect, rectX, 0)
    mainRect.setAttribute('stroke', this.color)
    mainRect.setAttribute('fill', this.fillColor)
    container.appendChild(mainRect)

    // render the lead and followUp time
    if (leadWidth > 0 || followUpWidth > 0) {
      // create a g element which contains the lead and followUp rectangles
      const decoratorContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g')

      if (leadWidth > 0) {
        this.renderTimeDecoration(context, decoratorContainer, leadWidth, layout, false)
      }
      if (followUpWidth > 0) {
        this.renderTimeDecoration(context, decoratorContainer, followUpWidth, layout, true)
      }
      container.appendChild(decoratorContainer)
    }

    // translate container to node position
    SvgVisual.setTranslate(container, layout.x, layout.y)

    // save node layout for later use in update
    ;(container as any)['data-size'] = layout.toSize()
    ;(container as any)['data-location'] = layout.toPoint()
    ;(container as any)['data-time-decoration'] = `${leadWidth}/${followUpWidth}`

    return new SvgVisual(container)
  }

  /**
   * Updates the visual element for the node with the current data.
   * @param context - The render context.
   * @param oldVisual - The visual that has been created in the call to
   *   {@link NodeStyleBase.createVisual}.
   * @param node - The node to which this style instance is assigned.
   */
  updateVisual(context: IRenderContext, oldVisual: Visual, node: INode): SvgVisual {
    const tag = node.tag
    const layout = node.layout

    if (!(oldVisual instanceof SvgVisual)) {
      // there's no old visual to update
      return this.createVisual(context, node)
    }

    const container = oldVisual.svgElement

    const leadWidth =
      typeof tag.leadTimeWidth === 'number' && tag.leadTimeWidth > 0
        ? (tag.leadTimeWidth as number)
        : 0
    const followUpWidth =
      typeof tag.followUpTimeWidth === 'number' && tag.followUpTimeWidth > 0
        ? (tag.followUpTimeWidth as number)
        : 0

    const rectWidth = layout.width + leadWidth + followUpWidth
    const rectX = -leadWidth

    const halfHeight = layout.height * 0.5

    // get the old and new node size
    const oldSize = (container as any)['data-size']
    const newSize = layout.toSize()
    const sizeChanged = !newSize.equals(oldSize)

    const oldLocation = (container as any)['data-location']
    const newLocation = layout.toPoint()
    const locationChanged = !newLocation.equals(oldLocation)

    const oldTimeDecoration = (container as any)['data-time-decoration']
    const newTimeDecoration = `${leadWidth}/${followUpWidth}`
    const timeDecorationChanged = newTimeDecoration !== oldTimeDecoration

    if (timeDecorationChanged || sizeChanged) {
      // update the background rect
      const backgroundRect = container.firstChild as SVGRectElement
      backgroundRect.width.baseVal.value = rectWidth
      backgroundRect.height.baseVal.value = layout.height
      backgroundRect.rx.baseVal.value = halfHeight
      backgroundRect.ry.baseVal.value = halfHeight
      SvgVisual.setTranslate(backgroundRect, rectX, 0)

      // update the main rect
      const mainRect = container.childNodes.item(1) as SVGRectElement
      mainRect.width.baseVal.value = rectWidth
      mainRect.height.baseVal.value = layout.height
      mainRect.rx.baseVal.value = halfHeight
      mainRect.ry.baseVal.value = halfHeight
      SvgVisual.setTranslate(mainRect, rectX, 0)
      // store the new values
      ;(container as any)['data-size'] = newSize
      ;(container as any)['data-time-decoration'] = newTimeDecoration

      if (leadWidth > 0 || followUpWidth > 0) {
        // update the lead and followUp decorations
        if (container.childElementCount < 3) {
          // there is no container - create it
          const el = document.createElementNS('http://www.w3.org/2000/svg', 'g')
          container.appendChild(el)
        }

        const decoratorContainer = container.lastChild as SVGElement
        // actually update the elements
        this.updateTimeDecoration(context, decoratorContainer, leadWidth, layout, false)
        this.updateTimeDecoration(context, decoratorContainer, followUpWidth, layout, true)
      } else {
        while (container.childElementCount > 2) {
          // there is nothing to render - remove the old elements container
          container.removeChild(container.lastChild!)
        }
      }
    }

    if (locationChanged) {
      // translate container to node position
      SvgVisual.setTranslate(container, layout.x, layout.y)
      ;(container as any)['data-location'] = newLocation
    }

    return oldVisual
  }

  /**
   * Creates the visualization for lead or followUp time and adds it to the container.
   */
  renderTimeDecoration(
    renderContext: IRenderContext,
    decoratorContainer: SVGElement,
    duration: number,
    nodeLayout: IRectangle,
    isFollowUpTime: boolean
  ): void {
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')

    pathElement.setAttribute(
      'd',
      this.createTimeDecorationPathData(duration, nodeLayout, isFollowUpTime)
    )

    this.patternFill.applyTo(pathElement, renderContext)
    pathElement.setAttribute('stroke', this.color)

    const clipPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath')
    const rectElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rectElement.x.baseVal.value = isFollowUpTime ? nodeLayout.width : -duration
    rectElement.y.baseVal.value = 0
    rectElement.width.baseVal.value = duration
    rectElement.height.baseVal.value = nodeLayout.height
    clipPathElement.appendChild(rectElement)
    const clipId = renderContext.svgDefsManager.generateUniqueDefsId()
    clipPathElement.setAttribute('id', clipId)

    pathElement.setAttribute('clip-path', `url(#${clipId})`)

    const innerContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    ;(innerContainer as any)['data-is-followup-time'] = isFollowUpTime

    innerContainer.appendChild(pathElement)
    innerContainer.appendChild(clipPathElement)

    if (!isFollowUpTime && decoratorContainer.childNodes.length > 0) {
      decoratorContainer.insertBefore(innerContainer, decoratorContainer.firstChild)
    } else {
      decoratorContainer.appendChild(innerContainer)
    }
  }

  /**
   * Updates the visual element representing the lead or followUp time and adds it to the container.
   */
  updateTimeDecoration(
    renderContext: IRenderContext,
    decoratorContainer: SVGElement,
    duration: number,
    nodeLayout: IRectangle,
    isFollowUpTime: boolean
  ) {
    const innerContainer = isFollowUpTime
      ? decoratorContainer.lastChild
      : decoratorContainer.firstChild

    if (duration > 0) {
      if (
        innerContainer === null ||
        (innerContainer as any)['data-is-followup-time'] !== isFollowUpTime
      ) {
        // the inner container is not present - we have to re-render the whole thing
        this.renderTimeDecoration(
          renderContext,
          decoratorContainer,
          duration,
          nodeLayout,
          isFollowUpTime
        )
      } else {
        const pathElement = innerContainer.firstChild as Element
        const rectElement = innerContainer.lastChild!.firstChild as SVGRectElement

        pathElement.setAttribute(
          'd',
          this.createTimeDecorationPathData(duration, nodeLayout, isFollowUpTime)
        )
        rectElement.x.baseVal.value = isFollowUpTime ? nodeLayout.width : -duration
        rectElement.y.baseVal.value = 0
        rectElement.width.baseVal.value = duration
        rectElement.height.baseVal.value = nodeLayout.height
      }
    } else if (
      innerContainer !== null &&
      (innerContainer as any)['data-is-followup-time'] === isFollowUpTime
    ) {
      // there is an old container that we have to remove
      decoratorContainer.removeChild(innerContainer)
    }
  }

  /**
   * Create the SVG path data.
   */
  createTimeDecorationPathData(
    duration: number,
    nodeLayout: IRectangle,
    isFollowUpTime: boolean
  ): string {
    const y = 0
    const y2 = nodeLayout.height
    const arcRadius = y2 * 0.5
    const x1 = isFollowUpTime ? nodeLayout.width - 1 : 1
    const x2 = isFollowUpTime ? nodeLayout.width + (duration - arcRadius) : -duration + arcRadius
    const arcSweep = isFollowUpTime ? 1 : 0
    return `M ${x1} ${y} L ${x2} ${y} a ${arcRadius},${arcRadius} 0 0,${arcSweep} 0,${y2} L ${x2} ${y2} L ${x1} ${y2} Z`
  }

  /**
   * Creates a hatch fill for the lead/followUp time using the given color.
   */
  private createPatternFill(color: string): PatternFill {
    const content = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    const patternSize = 6
    line.setAttribute('x1', '0')
    line.setAttribute('y1', `${patternSize}`)
    line.setAttribute('x2', `${patternSize}`)
    line.setAttribute('y2', '0')
    line.setAttribute('stroke', color)
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('width', patternSize.toString())
    rect.setAttribute('height', patternSize.toString())
    rect.setAttribute('fill', '#fff')

    content.appendChild(rect)
    content.appendChild(line)
    const newPatternFill = new PatternFill()
    newPatternFill.content = new SvgVisual(content)
    newPatternFill.origin = new Point(0, 0)
    newPatternFill.size = new Size(patternSize, patternSize)
    return newPatternFill
  }

  /**
   * Get the bounding box of the node
   * This is used for bounding box calculations.
   */
  getBounds(canvasContext: ICanvasContext, node: INode): Rect {
    const layout = node.layout
    // expand bounds to include lead and followUp time
    const tag = node.tag
    const leadWidth: number =
      typeof tag.leadTimeWidth === 'number' && tag.leadTimeWidth > 0 ? tag.leadTimeWidth : 0
    const followUpWidth: number =
      typeof tag.followUpTimeWidth === 'number' && tag.followUpTimeWidth > 0
        ? tag.followUpTimeWidth
        : 0
    const x = layout.x - leadWidth
    const w = layout.width + leadWidth + followUpWidth
    return new Rect(x, layout.y, w, layout.height)
  }

  /**
   * Checks if the node is visible.
   * This method is overridden to include the lead and followUp time.
   */
  isVisible(canvasContext: ICanvasContext, clip: Rect, node: INode): boolean {
    if (super.isVisible(canvasContext, clip, node)) {
      return true
    }
    const bounds = this.getBounds(canvasContext, node)
    return bounds.intersects(clip)
  }

  /**
   * Checks if the node is hit. Always returns false if the node has no height.
   */
  isHit(context: IInputModeContext, p: Point, node: INode): boolean {
    // consider lead and followUp time
    return this.getBounds(context, node).contains(p)
  }

  /**
   * Overridden to switch off the default selection decoration.
   */
  lookup(node: INode, type: Class): any {
    if (type === ISelectionIndicatorInstaller.$class || type === IFocusIndicatorInstaller.$class) {
      // return  new selection installer without a template id, which renders nothing
      return new RectangleIndicatorInstaller()
    }
    return super.lookup.call(this, node, type)
  }
}
