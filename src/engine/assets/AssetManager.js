export class AssetManager{
 constructor(){this.images=new Map();}
 loadImage(key,url){if(this.images.has(key))return this.images.get(key);const promise=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`No se pudo cargar el recurso: ${url}`));image.src=url;});this.images.set(key,promise);return promise;}
 async getImage(key){const image=this.images.get(key);if(!image)throw new Error(`Recurso no registrado: ${key}`);return image;}
 clear(){this.images.clear();}
}
