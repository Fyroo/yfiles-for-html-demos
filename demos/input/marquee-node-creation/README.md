# Marquee Rectangle Node Creation Demo

<img src="../../resources/image/marquee-node-creation.png" alt="demo-thumbnail" height="320"/>

[You can also run this demo online](https://live.yworks.com/demos/input/marquee-node-creation/index.html).

# Marquee Rectangle Node Creation Demo

This demo shows how to use [MarqueeSelectionInputMode](https://docs.yworks.com/yfileshtml/#/api/MarqueeSelectionInputMode) to create new nodes.

This is done by adding a listener that creates a node the size of the marquee rectangle when a selection is finished.

Also note that the marquee rectangle snaps to other nodes. This is achieved by using a custom [MarqueeSelectionInputMode](https://docs.yworks.com/yfileshtml/#/api/MarqueeSelectionInputMode) and relaying the size and location of the marquee rectangle to a [SnapContext](https://docs.yworks.com/yfileshtml/#/api/SnapContext), which provides a visualisation as well as a [SnapResult](https://docs.yworks.com/yfileshtml/#/api/SnapResult) to which the marquee rectangle can be snapped to. The [NodeStyle](https://docs.yworks.com/yfileshtml/#/api/NodeStyle) used for default node creation is reused in the marquee's template to style the selection rectangle.

## Things to Try

Drag the mouse to span a rectangular selection that transforms into a node on release.
