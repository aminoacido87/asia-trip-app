const fetch = require('node-fetch');
const CITY = {PVG:'Shanghai', PEK:'Pechino', SZX:'Shenzhen', XIY:"Xi'an", DPS:'Bali', LOP:'Lombok', MIL:'Milano'};
const TRAIN = {'PVG-PEK':90,'PEK-PVG':90,'PVG-XIY':75,'XIY-PVG':75,'SZX-PVG':85,'SZX-PEK':110,'PEK-SZX':110};
async function token(){
  const id=process.env.AMADEUS_CLIENT_ID, secret=process.env.AMADEUS_CLIENT_SECRET;
  if(!id||!secret) throw new Error('Mancano AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET nelle variabili ambiente.');
  const url=(process.env.AMADEUS_BASE_URL||'https://test.api.amadeus.com')+'/v1/security/oauth2/token';
  const r=await fetch(url,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:id,client_secret:secret})});
  const j=await r.json(); if(!r.ok) throw new Error(j.error_description||'Token Amadeus fallito'); return j.access_token;
}
async function offer(t, origin, dest, date, adults, currency){
  const base=process.env.AMADEUS_BASE_URL||'https://test.api.amadeus.com';
  const qs=new URLSearchParams({originLocationCode:origin,destinationLocationCode:dest,departureDate:date,adults:String(adults),currencyCode:currency,max:'5'});
  const r=await fetch(`${base}/v2/shopping/flight-offers?${qs}`,{headers:{authorization:`Bearer ${t}`}});
  const j=await r.json(); if(!r.ok) return null;
  const best=(j.data||[]).sort((a,b)=>Number(a.price.total)-Number(b.price.total))[0]; if(!best) return null;
  let stops=0, mins=0; for(const itin of best.itineraries||[]){ for(const seg of itin.segments||[]) stops++; const m=(itin.duration||'').match(/PT(?:(\d+)H)?(?:(\d+)M)?/); if(m) mins+=(+m[1]||0)*60+(+m[2]||0); }
  return {price:Number(best.price.total), stops:Math.max(0,stops-1), hours:mins/60};
}
function pairs(china){ const wanted=[['PVG','PEK'],['PEK','PVG'],['PVG','XIY'],['XIY','PVG'],['SZX','PVG'],['SZX','PEK'],['PEK','SZX']]; return wanted.filter(p=>china.includes(p[0])&&china.includes(p[1])); }
function score(price, stops, hours, weather, budget){ if(!price) return 0; let s=10; s-=Math.max(0,(price-budget)/100)*0.45; s-=stops*0.35; s-=Math.max(0,hours-28)*0.08; s+=(weather-7)*0.35; return Math.max(1,Math.min(10,s)); }
exports.handler = async (event)=>{
  try{
    const p=JSON.parse(event.body||'{}'); const t=await token(); const results=[];
    for(const d of p.dates){ for(const [c1,c2] of pairs(p.china)){ for(const indo of p.indo){
      const midDate=new Date(d.start); midDate.setDate(midDate.getDate()+7); const flyIndoDate=midDate.toISOString().slice(0,10);
      const f1=await offer(t,p.origin,c1,d.start,p.adults,p.currency); const f2=await offer(t,c2,indo,flyIndoDate,p.adults,p.currency); const f3=await offer(t,indo,p.origin,d.end,p.adults,p.currency);
      const total=[f1,f2,f3].reduce((a,x)=>a+(x?.price||0),0); const ok=f1&&f2&&f3; const train=TRAIN[`${c1}-${c2}`]||80; const weather=Math.round(((['DPS','LOP'].includes(indo)?9:7)+8)/2);
      const pricePerPerson=ok?total/p.adults:null; const stops=[f1,f2,f3].reduce((a,x)=>a+(x?.stops||0),0); const hours=[f1,f2,f3].reduce((a,x)=>a+(x?.hours||0),0);
      results.push({scenario:d.name,route:`${p.origin} → ${c1} (${CITY[c1]}) → treno → ${c2} (${CITY[c2]}) → ${indo} (${CITY[indo]}) → ${p.origin}`,pricePerPerson,stops,totalHours:hours,trainCost:`~€${train}/pax`,weather,score:score(pricePerPerson,stops,hours,weather,p.budget),pro:c1==='SZX'||c2==='SZX'?'testa vantaggio Sud Cina':'itinerario classico',con:indo==='LOP'?'meno voli diretti':'Bali più semplice'});
    }}}
    return {statusCode:200,body:JSON.stringify({results})};
  }catch(e){return {statusCode:500,body:JSON.stringify({error:e.message})};}
};
