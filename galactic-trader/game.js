'use strict';
(() => {
  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d');
  const status = document.getElementById('status');
  const keys = new Set();
  const TAU = Math.PI * 2;
  const FAR = 1450, COUNT = 1100;
  let w = 1000, h = 625, last = 0, elapsed = 0, seed = 0x5eed;
  const pilot = {x:0,y:0,z:0,speed:25, pitchRate:0, rollRate:0, pitchAngle:0, rollAngle:0};
  // The contact is a fixed object in WORLD space, never attached to the reticle.
  // Its nose points along +Z; its longitudinal (nose-to-tail) axis is Z.
  const trainingContact = {x:32,y:7,z:260,scale:1.0};
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
  const controls = new Set(['KeyS','KeyW','ArrowUp','ArrowDown','KeyA','KeyD','Space','Slash','KeyR']);
  addEventListener('keydown',e=>{if(controls.has(e.code)){e.preventDefault();keys.add(e.code);}if(e.code==='KeyR'&&!e.repeat)reset();});
  addEventListener('keyup',e=>keys.delete(e.code));
  addEventListener('blur',()=>keys.clear());
  function reset(){Object.assign(pilot,{x:0,y:0,z:0,speed:25,pitchRate:0,rollRate:0,pitchAngle:0,rollAngle:0});right=[1,0,0];up=[0,1,0];forward=[0,0,1];for(const s of stars)s.prev=null;status.textContent='NAV RESET';}

  // Elite flight model: two LOCAL control axes, roll about the ship's
  // nose-to-tail (forward) axis and pitch about its right/left axis.
  // Maintain an orthonormal camera basis; do not accumulate global Euler angles.
  let right=[1,0,0], up=[0,1,0], forward=[0,0,1];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function norm(a){const d=Math.hypot(...a)||1;return a.map(v=>v/d);}
  function rotate(v,axis,angle){
    const c=Math.cos(angle),s=Math.sin(angle),q=cross(axis,v),d=dot(axis,v)*(1-c);
    return [v[0]*c+q[0]*s+axis[0]*d,v[1]*c+q[1]*s+axis[1]*d,v[2]*c+q[2]*s+axis[2]*d];
  }
  function steer(dp,dr){
    // Local aircraft axes: X=right wing, Y=up, Z=nose.
    // Positive pitch turns the nose towards +up.  The world consequently
    // moves DOWN the screen, regardless of the ship's current roll.
    // Positive roll turns the right wing towards -up.
    // Apply pitch about the *current* right-wing axis, never the world X/Z.
    if(dp){
      forward=rotate(forward,right,-dp);
      up=rotate(up,right,-dp);
    }
    if(dr){
      right=rotate(right,forward,-dr);
      up=rotate(up,forward,-dr);
    }
    // Re-orthogonalise without modifying the desired forward direction.
    forward=norm(forward);
    right=norm(cross(up,forward));
    up=norm(cross(forward,right));
  }
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
    const c=trainingContact;
    // Convert EVERY vertex from the ship's fixed world coordinates into
    // camera coordinates. Never anchor its centre to screen positions.
    const verts=model.vertices.map(v=>cameraPoint(
      c.x+v[0]*c.scale,c.y+v[1]*c.scale,c.z+v[2]*c.scale
    ));
    ctx.save();ctx.shadowColor='#64ff9a';ctx.shadowBlur=12;
    for(const [a,b] of model.edges){
      const A=verts[a],B=verts[b];
      if(A[2]<3||B[2]<3)continue;
      const pa=project(A),pb=project(B);
      if(pa&&pb)line(pa[0],pa[1],pb[0],pb[1],.88,1.35);
    }
    ctx.restore();
    const xy=project(cameraPoint(c.x,c.y,c.z));
    if(xy && xy[0]>0 && xy[0]<w && xy[1]>0 && xy[1]<h)
      label('CONTACT 01',xy[0]+35,xy[1]-28,10);
  }
  function hud(boost){
    const pad=Math.max(18,w*.033),cx=w/2,cy=h/2;
    ctx.save();ctx.shadowColor='#4aff8d';ctx.shadowBlur=5;
    label('GALACTIC TRADER  //  NAVCOM',pad,28,Math.max(11,w*.016));
    label('TRAINING SECTOR',w-pad,28,Math.max(11,w*.016),'right');
    label(`SPD ${Math.round(pilot.speed).toString().padStart(3,'0')} KM/S`,pad,h-69);
    label(`ROLL RATE ${(pilot.rollRate*180/Math.PI).toFixed(0)}°/S`,pad,h-47);
    label(`PITCH RATE ${(pilot.pitchRate*180/Math.PI).toFixed(0)}°/S`,pad,h-25);
    label('SHIELDS 100%',w-pad,h-69,12,'right');label('FUEL 100%',w-pad,h-47,12,'right');
    label('CREDITS 100.0',w-pad,h-25,12,'right');
    line(cx-25,cy,cx-9,cy,.8);line(cx+9,cy,cx+25,cy,.8);line(cx,cy-25,cx,cy-9,.8);line(cx,cy+9,cx,cy+25,.8);
    ctx.strokeStyle='#62ff94';ctx.strokeRect(pad,h-113,Math.max(5,pilot.speed)*1.05,5);
    // Ship-relative attitude cue: its pitch deflection is vertical on screen.
    const pitchCue = Math.max(-1,Math.min(1,pilot.pitchRate/1.35));
    line(cx-6,cy+46,cx+6,cy+46,.3);
    if(Math.abs(pitchCue)>.025){
      const dir=pitchCue>0?-1:1;
      line(cx,cy+45,cx,cy+45+dir*Math.abs(pitchCue)*24,.95,2);
      label(pitchCue>0?'CLIMB':'DIVE',cx+12,cy+51,10);
    }
    label('PITCH: X / S OR UP / DOWN   //   ROLL: , / .',cx,h-25,11,'center');
    label(`ROLL ${((pilot.rollAngle*180/Math.PI)%360).toFixed(0)}°  PITCH ${((pilot.pitchAngle*180/Math.PI)%360).toFixed(0)}°`,cx,48,11,'center');
    ctx.restore();
  }
  function frame(ms){
    const dt=Math.min((ms-last)/1000||0,.05);last=ms;elapsed+=dt;
    // KeyD/comma and X/S reproduce original Elite key assignments.
    // Rate targets are smoothed for analogue-feeling steering; releasing a
    // key recentres the control rate rather than snapping orientation back.
    const maxRoll=1.28,maxPitch=1.35;
    const rollInput=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
    const pitchInput=((keys.has('KeyS')||keys.has('ArrowUp'))?1:0)-((keys.has('KeyW')||keys.has('ArrowDown'))?1:0);
    const smooth=1-Math.exp(-8*dt);
    pilot.rollRate+=(rollInput*maxRoll-pilot.rollRate)*smooth;
    pilot.pitchRate+=(pitchInput*maxPitch-pilot.pitchRate)*smooth;
    const dp=pilot.pitchRate*dt, dr=pilot.rollRate*dt;
    steer(dp,dr);
    pilot.pitchAngle+=dp;pilot.rollAngle+=dr;
    if(keys.has('Space'))pilot.speed+=36*dt;
    if(keys.has('Slash'))pilot.speed-=36*dt;
    pilot.speed=Math.max(0,Math.min(150,pilot.speed));
    const boost=false,step=pilot.speed*dt;
    pilot.x+=forward[0]*step;pilot.y+=forward[1]*step;pilot.z+=forward[2]*step;
    ctx.clearRect(0,0,w,h);
    renderStars(dt,boost);renderShip();hud(boost);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
