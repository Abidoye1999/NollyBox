const CACHE='nollybox-shell-v6';
const SHELL=['./','./index.html','./manifest.json','./icons/nollybox-512.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

function fetchWithTimeout(req,ms=5000){
  return Promise.race([
    fetch(req,{cache:'no-store'}),
    new Promise((_,reject)=>setTimeout(()=>reject(new Error('network timeout')),ms))
  ]);
}

self.addEventListener('fetch',event=>{
  const req=event.request;
  const u=new URL(req.url);
  if(u.origin!==self.location.origin)return;

  const isPage=req.mode==='navigate'||u.pathname.endsWith('/index.html');
  if(isPage){
    event.respondWith(
      fetchWithTimeout(req,5000)
        .then(res=>{
          if(res.ok){
            const copy=res.clone();
            caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
          }
          return res;
        })
        .catch(()=>caches.match(req).then(cached=>cached||caches.match('./index.html')))
    );
    return;
  }

  if(u.pathname.endsWith('/service-worker.js')){
    event.respondWith(fetch(req,{cache:'no-store'}));
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>cached||fetch(req).then(res=>{
      if(res.ok){
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
      }
      return res;
    }))
  );
});