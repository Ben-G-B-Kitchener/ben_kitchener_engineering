'use strict';
(() => {
  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d');
  const status = document.getElementById('status');
  const keys = new Set();
  const TAU = Math.PI * 2;
  const N = 320;
  let w = 1000, h = 625, last = 0, tick = 0;
  const ship = {pitch:0,yaw:0,roll:0,speed:25,x:0,y:0,z:0};
  let seed = 0x5eed;
  function rand(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
  const stars = Array.from({length:N},()=>({x:(rand()-.5)*1100,y:(rand()-.5)*700,z:35+rand()*1100,bright:.35+rand()*.65}));
  const model = {
    vertices:[[-20,-6,-8],[20,-6,-8],[0,0,34],[0,7,-20],[-35,0,-15],[35,0,-15],[0,-5,-24]],
    edges:[[0,2],[1,2],[0,4],[1,5],[4,3],[3,5],[4,6],[6,5],[0,1],[3,2]]
  };
  function resize(){const b=canvas.getBoundingClientRect();const d=Math.min(devicePixelRatio||1,2);w=b.width;h=b.height;canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);}
  new ResizeObserver(resize).observe(canvas);resize();
  const controlled=new Set(['KeyW','KeyS','KeyA','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','Space','KeyR']);
  window.addEventListener('keydown',e=>{if(controlled.has(e.code)){e.preventDefault();keys.add(e.code)}if(e.code==='KeyR'&&!e.repeat)reset();});
  window.addEventListener('keyup',e=>keys.delete(e.code));
  window.addEventListener('blur',()=>keys.clear());
  function reset(){Object.assign(ship,{pitch:0,yaw:0,roll:0,speed:25,x:0,y:0,z:0});status.textContent='NAV RESET';}
  function rotation(x,y,z){
    let a=ship.roll,b=ship.pitch,c=ship.yaw;
    let xx=x*Math.cos(a)-y*Math.sin(a), yy=x*Math.sin(a)+y*Math.cos(a);
    let y2=yy*Math.cos(b)-z*Math.sin(b), z2=yy*Math.sin(b)+z*Math.cos(b);
    return [xx*Math.cos(c)+z2*Math.sin(c),y2,-xx*Math.sin(c)+z2*Math.cos(c)];
  }
  function project(p){if(p[2]<=2)return null;let f=Math.min(w*0.95,h*1.5);return [w/2+f*p[0]/p[2],h/2-f*p[1]/p[2]];}
  function line(x,y,x2,y2,alpha=1,width=1){ctx.strokeStyle=`rgba(94,255,146,${alpha})`;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
  function text(s,x,y,size=12,align='left'){ctx.font=`${size}px Consolas, monospace`;ctx.textAlign=align;ctx.fillStyle='#67ff99';ctx.fillText(s,x,y);}
  function horizon(){let cy=h/2+Math.sin(ship.pitch)*h*.4;let tilt=Math.sin(ship.roll)*w*.35;line(0,cy-tilt,w,cy+tilt,.19);for(let i=-2;i<=2;i++){if(!i)continue;let yy=cy+i*h*.09;line(w*.45,yy,w*.55,yy,.12);}}
  function renderStars(dt){for(const s of stars){s.z-=ship.speed*dt*1.7; if(s.z<4){s.z+=1100;s.x=(rand()-.5)*1100;s.y=(rand()-.5)*700;}const p=rotation(s.x,s.y,s.z);const xy=project(p);if(!xy)continue;let [x,y]=xy;if(x<0||x>w||y<0||y>h)continue;const radius=Math.max(.4,Math.min(2.1,160/p[2]));ctx.fillStyle=`rgba(120,255,166,${s.bright})`;ctx.fillRect(x,y,radius,radius);if(ship.speed>65){let prev=project(rotation(s.x,s.y,s.z+ship.speed*dt*5));if(prev)line(x,y,prev[0],prev[1],s.bright*.5);}}}
  // Rotate every vertex into the pilot's camera frame, not just the ship centre.
  // In v0.1 only the centre was transformed: yaw moved the object sideways
  // without changing its wireframe perspective.
  function renderShip(){
    const distance = 460;
    const spin = tick * .18;
    const verts = model.vertices.map(v => {
      const xx = v[0]*Math.cos(spin)+v[2]*Math.sin(spin);
      const zz = -v[0]*Math.sin(spin)+v[2]*Math.cos(spin);
      return project(rotation(xx, v[1]+9, distance+zz));
    });
    ctx.save();
    ctx.shadowColor='#59ff91';ctx.shadowBlur=9;
    for(const [a,b] of model.edges){
      if(verts[a]&&verts[b])line(...verts[a],...verts[b],.8,1.2);
    }
    ctx.restore();
  }
  function hud(){const pad=Math.max(18,w*.033);ctx.save();ctx.shadowColor='#4aff8d';ctx.shadowBlur=5;text('GALACTIC TRADER  //  NAVCOM',pad,28,Math.max(11,w*.016));text('SOL SYSTEM',w-pad,28,Math.max(11,w*.016),'right');text(`SPD ${ship.speed.toFixed(0).padStart(3,'0')}  KM/S`,pad,h-69);text(`HDG ${((((ship.yaw*180/Math.PI)%360)+360)%360).toFixed(0).padStart(3,'0')}°`,pad,h-47);text(`PITCH ${(ship.pitch*180/Math.PI).toFixed(0)}°`,pad,h-25);text('SHIELDS 100%',w-pad,h-69,12,'right');text('FUEL  100%',w-pad,h-47,12,'right');text('CREDITS  100.0',w-pad,h-25,12,'right');const cx=w/2,cy=h/2;line(cx-25,cy,cx-9,cy,.75);line(cx+9,cy,cx+25,cy,.75);line(cx,cy-25,cx,cy-9,.75);line(cx,cy+9,cx,cy+25,.75);ctx.strokeStyle='#62ff94';ctx.strokeRect(pad,h-113,Math.max(65,ship.speed)*1.05,5);text(keys.has('Space')?'BOOST ACTIVE':'SCANNER ONLINE',w/2,h-25,11,'center');ctx.restore();}
  function frame(ms){const dt=Math.min((ms-last)/1000||0,.05);last=ms;tick+=dt;const turn=1.0*dt; if(keys.has('KeyW'))ship.pitch+=turn;if(keys.has('KeyS'))ship.pitch-=turn;if(keys.has('KeyA'))ship.yaw-=turn;if(keys.has('KeyD'))ship.yaw+=turn;if(keys.has('KeyQ'))ship.roll-=turn;if(keys.has('KeyE'))ship.roll+=turn;if(keys.has('ArrowUp'))ship.speed+=40*dt;if(keys.has('ArrowDown'))ship.speed-=40*dt;ship.speed=Math.max(0,Math.min(150,ship.speed));const boost=keys.has('Space');const effective=ship.speed*(boost?2.5:1);ctx.clearRect(0,0,w,h);horizon();let old=ship.speed;ship.speed=effective;renderStars(dt);ship.speed=old;renderShip();hud();requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
})();
