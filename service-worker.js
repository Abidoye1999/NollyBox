const CACHE='nollybox-shell-v4';
const SHELL=['./','./index.html','./manifest.json'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 const u=new URL(req.url);
 if(u.origin!==self.location.origin)return;
 const isPage=req.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/service-worker.js');
 if(isPage){
  event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{
   if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
   return res;
  }).catch(()=>caches.match(req).then(cached=>cached||caches.match('./index.html'))));
  return;
 }
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{
  if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
  return res;
 })));
});
