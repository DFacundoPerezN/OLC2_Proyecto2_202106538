class NodeBase {
  constructor(type){
    this.type = type;
    this.value = null;
    this.children = [];
  }
}

class NodeID extends NodeBase {
  constructor(type){
    super(type);
    this.line = 0;
    this.column = 0;
  }
}


export {
  NodeBase,
  NodeID
}