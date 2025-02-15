# Port Candidate Provider Demo

<img src="../../resources/image/portcandidateprovider.png" alt="demo-thumbnail" height="320"/>

[You can also run this demo online](https://live.yworks.com/demos/input/portcandidateprovider/index.html).

# Port Candidate Provider Demo

This demo shows how edge creation can be customized by implementing the [IPortCandidateProvider](https://docs.yworks.com/yfileshtml/#/api/IPortCandidateProvider) interface.

Add the custom implementation as decoration to the edge decorator of the graph to use it.

## Things to Try

Initiate edge creation by dragging from an unselected node (with the left mouse button pressed). Releasing the button finishes edge creation if the mouse is on a valid target and creates a bend otherwise.

## Node Types

- _Red nodes_ cannot have any edges. You cannot start or end an edge at them. A red port candidate highlights that these nodes are invalid targets.
- Only edges from other _green nodes_ can end at green nodes.
- _Blue nodes_ provide a set of predefined ports. Only one edge can be connected to each of these ports. Occupied ports are highlighted in red.
- _Orange nodes_ provide dynamic port candidates. Edges can start and end anywhere inside these nodes when the Shift key is pressed.
