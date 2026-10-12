'use strict';
(() => {
  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d');
  const status = document.getElementById('status');
  const keys = new Set();
  const TAU = Math.PI * 2;
  const FAR = 1450, COUNT = 1100;
  let w = 1000, h = 625, last = 0, elapsed = 0, seed = 0x5eed;
  const pilot = {x:0,y:0,z:0,pitch:0,yaw:0,roll:0,speed:25};
  // Training contact stays within the forward viewport while its WORLD-fixed
  // orientation is transformed through the same camera basis as the starfield.
  // Future navigation targets will use world-space positions instead.
  const trainingContact = {screenX:0.12,screenY:0.02,distance:160,scale:1.0};
  function rand(){seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296;}
  const stars = Array.from({length:COUNT}, () => ({x:(rand()-.5)*2*FAR,y:(rand()-.5)*2*FAR,z:(rand()-.5)*2*FAR,brightness:.3+rand()*.7,radius:.5+rand()*1.1,twinkle:rand()*TAU,prev:null}));
  const model = {
    vertices:[[-20,-6,-8],[20,-6,-8],[0,0,34],[0,7,-20],[-35,0,-15],[35,0,-15],[0,-5,-24]],
    edges:[[0,2],[1,2],[0,4],[1,5],[4,3],[3,5],[4,6],[6,5],[0,1],[3,2]]
  };
  function resize(){
    const r=canvas.getBoundingClientRect(), d=Math.min(window.devicePixelRatio||1,2);
    w=r.width; h=r.height; canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
    ctx.setTransform(d,0,0,d,0,0);
    for(const star of stars)star.prev=null;
  }
  new ResizeObserver(resize).observe(canvas);resize();
  const controls = new Set(['KeyW','KeyS','KeyA','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','Space','KeyR']);
  addEventListener('keydown',e=>{if(controls.has(e.code)){e.preventDefault();keys.add(e.code);}if(e.code==='KeyR'&&!e.repeat)reset();});
  addEventListener('keyup',e=>keys.delete(e.code));
  addEventListener('blur',()=>keys.clear());
  function reset(){Object.assign(pilot,{x:0,y:0,z:0,pitch:0,yaw:0,roll:0,speed:25});for(const s of stars)s.prev=null;status.textContent='NAV RESET';}

  // Three orthogonal camera axes in WORLD coordinates. Rotation applies local
  // roll, pitch, yaw; projections use the inverse (dot products), not the
  // forward camera rotation erroneously used in v0.1.1.
  function rotateLocal(x,y,z){
    const r=pilot.roll,p=pilot.pitch,a=pilot.yaw;
    const x1=x*Math.cos(r)-y*Math.sin(r), y1=x*Math.sin(r)+y*Math.cos(r);
    const y2=y1*Math.cos(p)-z*Math.sin(p), z2=y1*Math.sin(p)+z*Math.cos(p);
    return [x1*Math.cos(a)+z2*Math.sin(a),y2,-x1*Math.sin(a)+z2*Math.cos(a)];
  }
  let right, up, forward;
  function updateBasis(){right=rotateLocal(1,0,0);up=rotateLocal(0,1,0);forward=rotateLocal(0,0,1);}
  function cameraPoint(x,y,z){
    const dx=x-pilot.x,dy=y-pilot.y,dz=z-pilot.z;
    return [dx*right[0]+dy*right[1]+dz*right[2],dx*up[0]+dy*up[1]+dz*up[2],dx*forward[0]+dy*forward[1]+dz*forward[2]];
  }
  function project(p){if(p[2]<3)return null;const f=Math.min(w*.95,h*1.5);return [w/2+f*p[0]/p[2],h/2-f*p[1]/p[2]];}
  function line(x,y,x2,y2,alpha=1,width=1){ctx.strokeStyle=`rgba(99,255,154,${alpha})`;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
  function label(s,x,y,size=12,align='left'){ctx.font=`${size}px Consolas,monospace`;ctx.textAlign=align;ctx.fillStyle='#76ffab';ctx.fillText(s,x,y);}
  // Keep the same stars in world space; recycle them only when the pilot
  // travels beyond the local cube. Yaw itself never moves or respawns stars.
  function wrapStar(s){
    let moved=false;
    for(const axis of ['x','y','z']){
      const d=s[axis]-pilot[axis];
      if(d>FAR){s[axis]-=2*FAR;moved=true;}
      else if(d< -FAR){s[axis]+=2*FAR;moved=true;}
    }
    if(moved)s.prev=null;
  }
  function renderStars(dt,boost){
    ctx.save();ctx.shadowColor='#65ffab';ctx.shadowBlur=3;
    for(const s of stars){
      wrapStar(s);
      const p=cameraPoint(s.x,s.y,s.z),xy=project(p);
      if(!xy||xy[0]<0||xy[0]>w||xy[1]<0||xy[1]>h){s.prev=null;continue;}
      const depth=Math.max(.16,1-p[2]/(FAR*1.8));
      const alpha=Math.min(.95,s.brightness*(.5+depth*.7)*(0.91+.09*Math.sin(elapsed*2+s.twinkle)));
      const radius=Math.min(2.3,s.radius*(.65+depth));
      if(s.prev){const dx=xy[0]-s.prev[0],dy=xy[1]-s.prev[1],len=Math.hypot(dx,dy);
        if(len>0.5&&len<75){
          const scale=Math.min(boost?3.5:1.35,16/len);
          line(xy[0],xy[1],xy[0]-dx*scale,xy[1]-dy*scale,alpha*(boost?.8:.38),Math.max(.5,radius*.65));
        }
      }
      ctx.fillStyle=`rgba(130,255,174,${alpha})`;
      ctx.fillRect(xy[0]-radius/2,xy[1]-radius/2,radius,radius);
      s.prev=xy;
    }
    ctx.restore();
  }
  function renderShip(){
    // A stabilised training contact: centre follows the pilot's viewport, but
    // vertices have a FIXED world orientation. Thus A/D visibly changes the
    // wireframe's silhouette instead of merely pushing it offscreen.
    const c=trainingContact;
    const centre=[c.screenX*c.distance,c.screenY*c.distance,c.distance];
    const verts=model.vertices.map(v=>{
      const x=v[0]*c.scale,y=v[1]*c.scale,z=v[2]*c.scale;
      return [
        centre[0]+x*right[0]+y*right[1]+z*right[2],
        centre[1]+x*up[0]+y*up[1]+z*up[2],
        centre[2]+x*forward[0]+y*forward[1]+z*forward[2]
      ];
    });
    ctx.save();ctx.shadowColor='#64ff9a';ctx.shadowBlur=12;
    for(const [a,b] of model.edges){
      const A=verts[a],B=verts[b];if(A[2]<3||B[2]<3)continue;
      const pa=project(A),pb=project(B);if(pa&&pb)line(pa[0],pa[1],pb[0],pb[1],.88,1.35);
    }
    ctx.restore();
    const xy=project(centre);
    if(xy)label('CONTACT 01  [TRACK]',xy[0]+55,xy[1]-40,10);
  }
  function hud(boost){
    const pad=Math.max(18,w*.033),cx=w/2,cy=h/2;
    ctx.save();ctx.shadowColor='#4aff8d';ctx.shadowBlur=5;
    label('GALACTIC TRADER  //  NAVCOM',pad,28,Math.max(11,w*.016));
    label('TRAINING SECTOR',w-pad,28,Math.max(11,w*.016),'right');
    label(`SPD ${Math.round(pilot.speed).toString().padStart(3,'0')} KM/S`,pad,h-69);
    label(`HDG ${(((pilot.yaw*180/Math.PI)%360+360)%360).toFixed(0).padStart(3,'0')}°`,pad,h-47);
    label(`PITCH ${(pilot.pitch*180/Math.PI).toFixed(0)}°`,pad,h-25);
    label('SHIELDS 100%',w-pad,h-69,12,'right');label('FUEL 100%',w-pad,h-47,12,'right');
    label('CREDITS 100.0',w-pad,h-25,12,'right');
    line(cx-25,cy,cx-9,cy,.8);line(cx+9,cy,cx+25,cy,.8);line(cx,cy-25,cx,cy-9,.8);line(cx,cy+9,cx,cy+25,.8);
    ctx.strokeStyle='#62ff94';ctx.strokeRect(pad,h-113,Math.max(5,pilot.speed)*1.05,5);
    label(boost?'BOOST ACTIVE':'CONTACT STABILISED',cx,h-25,11,'center');
    // Rotation indicator: yaw is a true heading change, not a ship model spin.
    label(`ROLL ${(pilot.roll*180/Math.PI).toFixed(0)}°`,cx,48,11,'center');
    ctx.restore();
  }
  function frame(ms){
    const dt=Math.min((ms-last)/1000||0,.05);last=ms;elapsed+=dt;
    const turn=1.0*dt;
    if(keys.has('KeyW'))pilot.pitch+=turn;
    if(keys.has('KeyS'))pilot.pitch-=turn;
    if(keys.has('KeyA'))pilot.yaw-=turn;
    if(keys.has('KeyD'))pilot.yaw+=turn;
    if(keys.has('KeyQ'))pilot.roll-=turn;
    if(keys.has('KeyE'))pilot.roll+=turn;
    if(keys.has('ArrowUp'))pilot.speed+=40*dt;
    if(keys.has('ArrowDown'))pilot.speed-=40*dt;
    pilot.speed=Math.max(0,Math.min(150,pilot.speed));
    updateBasis();
    const boost=keys.has('Space'),step=pilot.speed*(boost?3:1)*dt;
    pilot.x+=forward[0]*step;pilot.y+=forward[1]*step;pilot.z+=forward[2]*step;
    ctx.clearRect(0,0,w,h);
    renderStars(dt,boost);renderShip();hud(boost);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
