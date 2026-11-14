export class EventBus{
 constructor(){this.listeners=new Map();}
 on(event,callback){if(!this.listeners.has(event))this.listeners.set(event,new Set());this.listeners.get(event).add(callback);return()=>this.off(event,callback);}
 once(event,callback){const unsubscribe=this.on(event,payload=>{unsubscribe();callback(payload);});return unsubscribe;}
 off(event,callback){this.listeners.get(event)?.delete(callback);}
 emit(event,payload){for(const callback of this.listeners.get(event)??[])callback(payload);}
 clear(){this.listeners.clear();}
}
