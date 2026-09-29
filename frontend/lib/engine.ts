// @ts-nocheck
// Generated from Snug.dc.html — scene renderer, sprites, presets and the app logic class.
import React from 'react';
const DCLogic = React.Component;
const INK='#1f1b2e',CREAM='#fbf6ec';
const TINT=['#f6c0b4','#f8d5ae','#f4e4a6','#cfe6b0','#aee0c6'];
const STRONG=['#dd6a58','#e8954f','#d9b23a','#7fb556','#3a9e74'];
const RLABEL=['Miserable','Meh','Okay','Good','Perfect'];
const band=s=>s>=85?4:s>=70?3:s>=55?2:s>=40?1:0;
function rnd(n){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
const CACHE={};const pix=(k,f)=>CACHE[k]||(CACHE[k]=f());

class Grid{
  constructor(w,h){this.w=w;this.h=h;this.p=new Array(w*h).fill(null);}
  r(x,y,w,h,c){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(i>=0&&j>=0&&i<this.w&&j<this.h)this.p[j*this.w+i]=c;}
  outline(c){const n=[...this.p];for(let j=0;j<this.h;j++)for(let i=0;i<this.w;i++){if(this.p[j*this.w+i])continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const x=i+a,y=j+b;return x>=0&&y>=0&&x<this.w&&y<this.h&&this.p[y*this.w+x];}))n[j*this.w+i]=c;}this.p=n;}
  url(){let s='';for(let y=0;y<this.h;y++){let x=0;while(x<this.w){const c=this.p[y*this.w+x];if(!c){x++;continue;}let x2=x+1;while(x2<this.w&&this.p[y*this.w+x2]===c)x2++;s+=`<rect x="${x}" y="${y}" width="${x2-x}" height="1" fill="${c}"/>`;x=x2;}}
    return 'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w*8}" height="${this.h*8}" shape-rendering="crispEdges">${s}</svg>`);}
}
const C3={tank:['#2f3a4a','#212a37','#46546a'],tee:['#ece6da','#cfc6b5','#faf7f0'],long:['#3b4f6e','#2c3c55','#566d91'],sweater:['#4f6b5a','#3a5243','#6a8a76'],
  light:['#7d8456','#60663f','#99a06d'],hoodie:['#3d4250','#2c303c','#565c6e'],coat:['#b08455','#8c6640','#c9a073'],rain:['#e07a3c','#b85f2c','#ee9a62'],
  shorts:['#b3a077','#94825c','#c9b891'],pants:['#34435f','#253149','#4a5b7c'],shoe:['#efeae0','#c9c2b4','#ffffff'],skin:['#e8b48e','#cc9470','#f4cba9'],hair:['#2a1d18','#1a110d','#4a342a'],beanie:['#3d4250','#2c303c','#565c6e'],scarf:['#d9a441','#b5862f','#e8bf6a'],umb:['#2f3a4a','#212a37','#46546a']};
// ---- who snug is: skin, girl/boy, hair, hair colour and a clothing style (set in onboarding; frontend only) ----
// Jev picks the kind of clothes (a light jacket, pants); the style decides what that looks like and is called.
const SKINS={porcelain:['#f3d2b8','#dcb193','#fbe3d0'],light:['#e8b48e','#cc9470','#f4cba9'],tan:['#c98e62','#a8714a','#dca47c'],brown:['#9a6440','#7c4d2f','#b27a53'],deep:['#6b4128','#52301c','#83533a']};
const HAIRC={black:['#1c1616','#0f0b0b','#3a3030'],darkbrown:['#2a1d18','#1a110d','#4a342a'],brown:['#5a3a24','#3f2718','#7a5236'],blonde:['#d9b36a','#b8924e','#ecd08e'],red:['#a5452a','#823420','#c4643f'],grey:['#9a9aa4','#7a7a84','#bdbdc6'],pink:['#e58fb5','#c46e95','#f4b3cf']};
const HAIRS=['short','buzz','curly','bob','long','ponytail','bun','afro','braids'];
const STYLES={
  casual:{label:'everyday denim',hint:'think American Eagle, Gap',
    pal:{pants:['#4a6a9a','#36507a','#6a8ab8'],light:['#5b7fae','#44628c','#7d9dc6']},
    names:{light:'denim jacket',pants:'jeans',shoe:'sneakers'}},
  surf:{label:'beachy surf',hint:'think Hollister, Abercrombie',
    pal:{tank:['#2f4a73','#22385a','#46638f'],tee:['#e9806e','#c9624f','#f4a192'],long:['#b0443c','#8a3029','#c8645a'],sweater:['#9aa0a8','#7c828a','#b7bcc3'],light:['#7a7a52','#5f5f3e','#96966c'],hoodie:['#3e4d6b','#2d3a54','#56678a'],coat:['#b98c5a','#98704a','#d1a878'],rain:['#e8b93a','#c79a22','#f2cf6a'],shorts:['#b7a57a','#968457','#cdbd95'],pants:['#7d9cc4','#617fa6','#9bb6d8'],shoe:['#f2efe8','#d2cdc2','#ffffff'],beanie:['#d9a441','#b5862f','#e8bf6a'],scarf:['#2f4a73','#22385a','#46638f']},
    names:{tank:'striped tank',tee:'surf tee',long:'flannel',sweater:'heather crewneck',light:'utility jacket',hoodie:'zip hoodie',coat:'sherpa jacket',shorts:'cargo shorts',pants:'light-wash jeans',shoe:'canvas sneakers'},det:{long:'check',shorts:'pockets',tank:'stripes'}},
  minimal:{label:'clean minimal',hint:'think Zara, COS, Uniqlo',
    pal:{tank:['#1f1f22','#141416','#34343a'],tee:['#f4f2ee','#d8d4cc','#ffffff'],long:['#1f1f22','#141416','#34343a'],sweater:['#b89773','#977a5a','#cfb391'],light:['#e6dccb','#c9bea9','#f2ebdf'],hoodie:['#8c8c90','#6f6f73','#a8a8ac'],coat:['#c29a6b','#a07c52','#d6b58c'],rain:['#2a2a2e','#1b1b1e','#404046'],shorts:['#2b2b30','#1d1d21','#404046'],pants:['#2b2b30','#1d1d21','#404046'],shoe:['#26262a','#161618','#3d3d42'],beanie:['#3a3a3f','#27272b','#55555b'],scarf:['#d8c9ad','#bba98a','#e8dcc6']},
    names:{tee:'boxy tee',long:'fine knit',sweater:'camel knit',light:'linen blazer',coat:'trench coat',rain:'rain shell',shorts:'tailored shorts',pants:'wide trousers',shoe:'leather sneakers'},det:{light:'lapels',coat:'belt'}},
  sporty:{label:'athletic',hint:'think Nike, Lululemon',
    pal:{tank:['#e04848','#b83434','#ee7070'],tee:['#f4f4f4','#d6d6d6','#ffffff'],long:['#26324f','#1a243b','#3a4868'],sweater:['#8c8f98','#6f727a','#a9acb4'],light:['#2aa39a','#1f827b','#4cc2b9'],hoodie:['#8c8f98','#6f727a','#a9acb4'],coat:['#2b2d33','#1c1e22','#43464e'],rain:['#d9e84a','#b6c433','#e8f27a'],shorts:['#26262b','#18181c','#3a3a40'],pants:['#6c6f78','#555861','#8a8d96'],shoe:['#f4f4f4','#d2d2d2','#ffffff'],beanie:['#26262b','#18181c','#3a3a40'],scarf:['#8c8f98','#6f727a','#a9acb4']},
    names:{tank:'training tank',tee:'performance tee',long:'track top',sweater:'quarter-zip',light:'windbreaker',hoodie:'tech hoodie',coat:'puffer',rain:'shell jacket',shorts:'running shorts',pants:'joggers',shoe:'running shoes'},det:{long:'armstripe',tee:'armstripe',shorts:'sidestripe',pants:'joggers',coat:'quilt',shoe:'accent'}},
  street:{label:'streetwear',hint:'think Stüssy, Supreme',
    pal:{tank:['#1f1f22','#141416','#34343a'],tee:['#1f1f22','#141416','#34343a'],long:['#1f1f22','#141416','#34343a'],sweater:['#4c6b3c','#3a5530','#678a52'],light:['#5d6340','#474c30','#777e55'],hoodie:['#1f1f22','#141416','#34343a'],coat:['#1f1f22','#141416','#34343a'],rain:['#1f1f22','#141416','#34343a'],shorts:['#6b6a45','#525134','#86855c'],pants:['#2b2b30','#1d1d21','#404046'],shoe:['#f0ede6','#b9b5ab','#ffffff'],beanie:['#e07a2c','#bd6220','#ee9a55'],scarf:['#1f1f22','#141416','#34343a']},
    names:{tank:'oversized tank',tee:'graphic tee',long:'oversized long sleeve',sweater:'oversized crewneck',light:'bomber jacket',hoodie:'graphic hoodie',coat:'puffer',rain:'windbreaker',shorts:'cargo shorts',pants:'cargo pants',shoe:'chunky sneakers'},det:{tee:'graphic',hoodie:'graphic',pants:'pockets',shorts:'pockets',light:'bomber',coat:'quilt',shoe:'chunky'}},
  preppy:{label:'preppy',hint:'think Ralph Lauren, J.Crew',
    pal:{tank:['#f4f2ee','#d8d4cc','#ffffff'],tee:['#2f4166','#223050','#465a85'],long:['#a9c4e6','#8aa8cd','#c6daf2'],sweater:['#ece2cc','#d2c5a8','#f6efe0'],light:['#26324f','#1a243b','#3a4868'],hoodie:['#2f4166','#223050','#465a85'],coat:['#b08455','#8c6640','#c9a073'],rain:['#3f5a44','#2e4433','#56735c'],shorts:['#d1bd8e','#b3a071','#e2d2aa'],pants:['#d1bd8e','#b3a071','#e2d2aa'],shoe:['#6b4226','#4e2f1a','#8a5a38'],beanie:['#2f4166','#223050','#465a85'],scarf:['#b0443c','#8a3029','#c8645a']},
    names:{tee:'polo',long:'oxford shirt',sweater:'cable knit',light:'navy blazer',hoodie:'quarter-zip',coat:'camel overcoat',rain:'waxed jacket',shorts:'chino shorts',pants:'chinos',shoe:'loafers'},det:{tee:'collar',long:'collar',sweater:'cable',light:'blazer'}},
  cozy:{label:'soft & cozy',hint:'think Aerie, Free People',
    pal:{tank:['#c8b6e2','#ab98c9','#dccdef'],tee:['#f2c4cf','#dba5b2','#f9dbe2'],long:['#bfb0db','#a292c2','#d7cbeb'],sweater:['#e3d4b8','#c9b898','#efe5d2'],light:['#b8643a','#964d2b','#cd8157'],hoodie:['#c8b6e2','#ab98c9','#dccdef'],coat:['#efe6d6','#d6cab5','#faf5ec'],rain:['#a3b597','#869a7a','#bfceb3'],shorts:['#b9b4c4','#9d98a8','#d0ccd9'],pants:['#8a6040','#6c4a30','#a57a57'],shoe:['#efe6d6','#d6cab5','#faf5ec'],beanie:['#efe6d6','#d6cab5','#faf5ec'],scarf:['#d9a441','#b5862f','#e8bf6a']},
    names:{tee:'soft tee',long:'striped top',sweater:'chunky knit',light:'corduroy jacket',hoodie:'fleece hoodie',coat:'teddy coat',rain:'raincoat',shorts:'lounge shorts',pants:'cords',shoe:'slip-ons'},det:{long:'stripes',sweater:'knit',pants:'ribs',coat:'teddy'}},
};
const AV_DEFAULT={skin:'light',body:'boy',hair:'short',hairColor:'darkbrown',style:'casual',skirt:false};
let AV={...AV_DEFAULT};
function avOf(a){const v={...AV_DEFAULT,...(a||{})};if(!SKINS[v.skin])v.skin='light';if(!HAIRC[v.hairColor])v.hairColor='darkbrown';if(!HAIRS.includes(v.hair))v.hair='short';if(!STYLES[v.style])v.style='casual';v.body=v.body==='girl'?'girl':'boy';v.skirt=!!v.skirt;return v;}
function setAvatar(a){AV=avOf(a);}
const avKey=a=>[a.skin,a.body,a.hair,a.hairColor,a.style,a.skirt?1:0].join('.');
const palOf=(a,k)=>(STYLES[a.style].pal||{})[k]||C3[k];
const DEF_NAMES={tank:'tank',tee:'tee',long:'long sleeve',sweater:'sweater',light:'light jacket',hoodie:'hoodie',coat:'coat',rain:'rain jacket',shorts:'shorts',pants:'pants',shoe:'sneakers'};
function nameOf(k,a){a=a||AV;if(k==='shorts'&&a.skirt)return 'skirt';return (STYLES[a.style].names||{})[k]||DEF_NAMES[k]||k;}

// 46x58 sprite. pose: stand | sit | kite. av: who snug is (skin, hair, style...), defaults to the current avatar
function sprite(o,mood,pose,av){const A=av?avOf(av):AV;return pix('s6'+JSON.stringify(o)+mood+pose+avKey(A),()=>{
  const W=46,H=58,g=new Grid(W,H),has=a=>o.acc.includes(a);
  const E=(cx,cy,rx,ry)=>(x,y)=>((x+0.5-cx)/rx)**2+((y+0.5-cy)/ry)**2<=1;
  const Rc=(x0,y0,x1,y1)=>(x,y)=>x>=x0&&x<=x1&&y>=y0&&y<=y1;
  const Tz=(y0,y1,l0,r0,l1,r1)=>(x,y)=>{if(y<y0||y>y1)return false;const f=(y-y0)/Math.max(1,y1-y0);return x>=Math.round(l0+(l1-l0)*f)&&x<=Math.round(r0+(r1-r0)*f);};
  const U=(...ms)=>(x,y)=>ms.some(m=>m(x,y));const N=(a,b)=>(x,y)=>a(x,y)&&!b(x,y);
  const part=(mask,[b,d,l])=>{for(let y=0;y<H;y++){let x=0;while(x<W){if(!mask(x,y)){x++;continue;}let x2=x;while(x2+1<W&&mask(x2+1,y))x2++;const n=x2-x+1;for(let i=x;i<=x2;i++){let c=b;if(n>=5&&i>=x2-1)c=d;else if(n>=3&&i===x2)c=d;else if(n>=4&&i===x)c=l;g.r(i,y,1,1,c);}x=x2+1;}}};
  const P=(x,y,c)=>g.r(x,y,1,1,c);
  const paint=(mask,y0,y1,c)=>{for(let y=y0;y<=y1;y++)for(let x=0;x<W;x++)if(mask(x,y))P(x,y,c);};
  const sit=pose==='sit',kite=pose==='kite',SK=SKINS[A.skin],HR=HAIRC[A.hairColor],ST=STYLES[A.style],DET=ST.det||{};
  const pal=k=>palOf(A,k);
  const TOP=pal(o.top),O=pal(o.outer),BOT=pal(o.bottom),SHOE=pal('shoe');
  const armL=Tz(23,35,9,12,10,12),armR=kite?Tz(9,23,28,31,27,30):Tz(23,35,27,30,27,29);
  const handL=E(11,37,1.8,2),handR=kite?E(30,8,1.8,2):E(28.5,37,1.8,2);
  const girl=A.body==='girl',torso=girl?Tz(22,36,12,27,15,24):Tz(22,36,12,27,14,25);
  const skirt=A.skirt&&o.bottom==='shorts';
  if(has('umbrella')&&!sit&&!kite){g.r(28,6,1,32,'#1c1a28');P(28,38,'#1c1a28');P(27,39,'#1c1a28');P(26,39,'#1c1a28');P(25,38,'#1c1a28');}
  // hair that sits behind the head
  if(A.hair==='afro'){part(E(20,10.5,11.5,10),HR);for(let i=0;i<22;i++){const x=9+((i*7)%23),y=2+((i*5)%13);if(E(20,10.5,11,9.5)(x,y))P(x,y,i%3?HR[1]:HR[2]);}}
  if(A.hair==='ponytail'){part(U(E(30.5,14,2.6,5.5),E(31,19,2,3)),HR);P(28,10,HR[2]);P(29,10,HR[2]);}
  if(A.hair==='bun'){part(E(20,4,3.8,3.2),HR);P(19,3,HR[2]);P(21,4,HR[1]);}
  if(o.outer==='hoodie')part(E(20,22.5,8,2.5),O);
  // legs and bottoms
  if(sit){part(E(20,41,12,4),BOT);if(o.bottom==='shorts'&&!skirt)part(E(20,42.6,8,1.8),SK);part(E(8.5,43,2.4,1.8),SHOE);part(E(31.5,43,2.4,1.8),SHOE);}
  else{const hips=Tz(36,39,14,25,14,25);
    if(skirt){part(Tz(36,45,14,25,11,28),BOT);part(Tz(46,51,15,17,15,17),SK);part(Tz(46,51,22,24,22,24),SK);for(let x=12;x<=27;x+=3)P(x,44,BOT[1]);}
    else if(o.bottom==='shorts'){part(U(hips,Tz(39,44,14,18,14,18),Tz(39,44,21,25,21,25)),BOT);part(Tz(45,51,15,17,15,17),SK);part(Tz(45,51,22,24,22,24),SK);
      if(DET.shorts==='pockets'){g.r(14,40,2,3,BOT[1]);g.r(24,40,2,3,BOT[1]);}if(DET.shorts==='sidestripe'){paint(Rc(14,37,14,44),37,44,'#f4f4f4');paint(Rc(25,37,25,44),37,44,'#f4f4f4');}}
    else{part(U(hips,Tz(39,51,14,18,15,18),Tz(39,51,21,25,21,24)),BOT);
      if(DET.pants==='pockets'){g.r(14,42,2,3,BOT[1]);g.r(24,42,2,3,BOT[1]);}
      if(DET.pants==='joggers'){g.r(15,50,4,2,BOT[1]);g.r(21,50,4,2,BOT[1]);}
      if(DET.pants==='ribs')for(let y=39;y<=50;y++)for(const x of [15,17,22,24])P(x,y,BOT[1]);}
    part(U(Rc(13,52,18,54),Rc(12,53,12,54)),SHOE);part(U(Rc(21,52,26,54),Rc(27,53,27,54)),SHOE);
    const sole=DET.shoe==='chunky'?'#b9b5ab':A.style==='minimal'?'#f2efe8':'#8f877a';g.r(12,55,7,1,sole);g.r(21,55,7,1,sole);if(DET.shoe==='chunky'){g.r(12,56,7,1,sole);g.r(21,56,7,1,sole);}
    if(DET.shoe==='accent'){g.r(14,53,3,1,'#e04848');g.r(22,53,3,1,'#e04848');}}
  part(armL,SK);part(armR,SK);part(handL,SK);part(handR,SK);
  part(Rc(18,19,21,22),SK);
  part(torso,TOP);
  const sleeveR=kite?Tz(18,23,28,31,27,30):Tz(23,28,27,30,27,30);
  const cuffs=c=>{paint(armL,34,35,c);if(kite)paint(armR,9,10,c);else paint(armR,34,35,c);};
  if(o.top==='tee'){part(U(Tz(23,28,9,12,9,12),sleeveR),TOP);part(U(Rc(18,22,21,22),Rc(19,23,20,23)),SK);}
  if(o.top==='tank'){part(U(Tz(22,24,12,14,13,14),Tz(22,24,25,27,25,26)),SK);part(E(20,22,2.8,1.8),SK);if(DET.tank==='stripes')for(let y=26;y<=34;y+=3)for(let x=12;x<=27;x++)if(torso(x,y))P(x,y,'#f4f2ee');}
  if(o.top==='long'||o.top==='sweater'){part(armL,TOP);part(armR,TOP);cuffs(TOP[1]);g.r(18,22,4,1,TOP[1]);}
  if(o.top==='long'&&!DET.long)for(let y=26;y<=34;y+=3)for(let x=12;x<=27;x++)if(torso(x,y))P(x,y,TOP[2]);
  if(o.top==='long'&&DET.long==='check'){for(let y=23;y<=35;y++)for(let x=9;x<=31;x++)if((torso(x,y)||armL(x,y)||armR(x,y))&&(x%4===0||y%4===0))P(x,y,TOP[1]);}
  if(o.top==='long'&&DET.long==='stripes'){for(let y=24;y<=35;y+=3)for(let x=9;x<=31;x++)if(torso(x,y)||armL(x,y)||armR(x,y))P(x,y,'#f4efe6');}
  if(o.top==='sweater'){for(let y=34;y<=36;y++)for(let x=12;x<=27;x++)if(torso(x,y)&&x%2)P(x,y,TOP[1]);
    if(DET.sweater==='cable')for(let y=24;y<=33;y++){P(y%2?16:17,y,TOP[1]);P(y%2?23:22,y,TOP[1]);}
    if(DET.sweater==='knit')for(let y=24;y<=33;y+=2)for(let x=13;x<=26;x+=2)if(torso(x,y))P(x+(y%4?1:0),y,TOP[1]);}
  if((o.top==='tee'||o.top==='long')&&DET[o.top]==='armstripe'){paint(Rc(10,24,10,35),24,o.top==='tee'?27:34,'#f4f4f4');paint(Rc(29,24,29,35),24,o.top==='tee'?27:34,'#f4f4f4');}
  if((o.top==='tee'||o.top==='long')&&DET[o.top]==='collar'){const c=o.top==='tee'?'#f4f2ee':'#f6f8fc';P(17,22,c);P(18,23,c);P(18,22,c);P(22,22,c);P(21,23,c);P(21,22,c);}
  if(o.top==='tee'&&DET.tee==='graphic'){g.r(17,26,6,4,'#e8e2d6');g.r(18,27,4,2,'#e07a2c');}
  const body=len=>Tz(22,len,12,27,14,25);
  if(o.outer==='light'){part(armL,O);part(armR,O);part(N(body(37),Rc(18,22,21,37)),O);for(let y=22;y<=25;y++){P(17,y,O[1]);P(22,y,O[1]);}g.r(13,30,3,2,O[1]);cuffs(O[1]);
    if(DET.light==='lapels'||DET.light==='blazer'){P(17,23,O[1]);P(18,24,O[1]);P(22,23,O[1]);P(21,24,O[1]);}
    if(DET.light==='blazer'){P(17,29,'#d9b45a');P(17,32,'#d9b45a');}
    if(DET.light==='bomber'){g.r(12,36,16,2,O[1]);cuffs('#e07a2c');}}
  if(o.outer==='hoodie'){part(U(body(37),armL,armR),O);part(Tz(30,35,15,24,14,25),[O[1],O[1],O[0]]);g.r(18,23,1,4,'#e8e2d6');g.r(21,23,1,4,'#e8e2d6');g.r(14,36,12,2,O[1]);cuffs(O[1]);
    if(DET.hoodie==='graphic'){g.r(16,26,8,3,'#e8e2d6');g.r(17,27,6,1,'#e07a2c');}}
  if(o.outer==='coat'){part(U(body(sit?38:45),armL,armR),O);for(let y=24;y<=(sit?38:45);y++)P(19,y,O[1]);g.r(14,31,12,1,O[1]);P(18,22,TOP[0]);P(19,22,TOP[0]);P(20,22,TOP[0]);cuffs(O[1]);
    if(DET.coat==='quilt')for(let y=25;y<=(sit?37:44);y+=3)for(let x=9;x<=31;x++)if(body(45)(x,y)||armL(x,y)||armR(x,y))P(x,y,O[1]);
    if(DET.coat==='belt')g.r(13,33,14,2,O[1]);
    if(DET.coat==='teddy')for(let i=0;i<40;i++){const x=10+((i*7)%20),y=23+((i*11)%21);if(body(45)(x,y)||armL(x,y)||armR(x,y))P(x,y,i%2?O[2]:O[1]);}}
  if(o.outer==='rain'){part(U(body(sit?38:42),armL,armR),O);for(let y=23;y<=(sit?38:42);y++)P(20,y,O[1]);g.r(14,34,4,1,O[1]);g.r(22,34,4,1,O[1]);cuffs(O[1]);}
  // head
  part(E(20,13,7.5,8),SK);part(E(11.8,14.5,1.2,1.8),SK);part(E(27.2,14.5,1.2,1.8),SK);
  const cap=N(E(20,11,8.6,7.6),(x,y)=>y>9);
  const h=A.hair;
  if(h==='buzz'){part(N(E(20,11.5,8.2,7),(x,y)=>y>8),HR);for(let x=14;x<=26;x+=3)P(x,6,HR[2]);}
  else if(h==='curly'){part(U(E(13.5,9,3,3),E(16.5,6.5,3,3),E(20,5.6,3.2,3),E(23.5,6.5,3,3),E(26.5,9,3,3),E(12.5,12,2,2.4),E(27.5,12,2,2.4),Rc(13,8,27,10)),HR);[[14,7],[18,5],[22,5],[25,8],[16,9],[23,9]].forEach(([x,y])=>P(x,y,HR[2]));}
  else if(h==='afro'){part(U(cap,Rc(12,10,13,12),Rc(27,10,28,12)),HR);}
  else{part(U(cap,Rc(13,10,22,10),Rc(13,11,17,11),Rc(12,10,12,15),Rc(27,10,27,13)),HR);[[16,5],[17,5],[18,6],[19,6],[15,6]].forEach(([x,y])=>P(x,y,HR[2]));}
  if(h==='bob'){part(U(Rc(11,9,13,20),Rc(26,9,28,20),Rc(13,10,26,10)),HR);P(11,20,HR[1]);P(28,20,HR[1]);}
  if(h==='long'){part(U(Rc(11,9,13,27),Rc(26,9,28,27)),HR);for(let y=12;y<=26;y+=3){P(12,y,HR[2]);P(27,y,HR[1]);}}
  if(h==='braids')for(const x0 of [11,27])for(let y=13;y<=30;y++){g.r(x0,y,2,1,y%3===0?HR[1]:HR[0]);if(y===30){g.r(x0,y,2,1,'#e8604c');}}
  if(girl){g.r(15,11,2,1,HR[1]);g.r(23,11,2,1,HR[1]);}else{g.r(14,12,3,1,HR[1]);g.r(23,12,3,1,HR[1]);}P(20,16,SK[1]);
  const mc=girl?'#b8485a':'#6e2f2b';
  const eyes=()=>{g.r(15,13,1,2,INK);g.r(24,13,1,2,INK);if(girl){P(14,12,INK);P(14,13,INK);P(25,12,INK);P(25,13,INK);}};
  if(A.body==='girl'&&mood!=='cold'&&mood!=='hot'){P(14,16,'#e89a86');P(25,16,'#e89a86');}
  if(mood==='happy'){eyes();P(18,18,mc);g.r(19,19,2,1,mc);P(21,18,mc);P(14,16,'#e89a86');P(25,16,'#e89a86');}
  else if(mood==='content'){eyes();g.r(19,19,2,1,mc);P(18,18,mc);P(21,18,mc);}
  else if(mood==='meh'){eyes();g.r(18,19,4,1,mc);}
  else if(mood==='grumpy'){eyes();P(14,11,HR[1]);P(25,11,HR[1]);g.r(19,18,2,1,mc);P(18,19,mc);P(21,19,mc);}
  else if(mood==='cold'){P(14,13,INK);P(15,14,INK);P(14,15,INK);P(25,13,INK);P(24,14,INK);P(25,15,INK);[[18,19],[19,18],[20,19],[21,18]].forEach(([x,y])=>P(x,y,'#6d5a9e'));P(19,16,'#e58383');P(20,16,'#e58383');g.r(13,16,3,1,'#9dbbe0');g.r(24,16,3,1,'#9dbbe0');g.r(14,17,2,1,'#b5cbe8');g.r(24,17,2,1,'#b5cbe8');}
  else if(mood==='hot'){g.r(14,14,3,1,INK);g.r(23,14,3,1,INK);P(14,12,HR[1]);P(25,12,HR[1]);g.r(19,18,2,2,mc);g.r(12,16,4,1,'#e8745f');g.r(24,16,4,1,'#e8745f');[[12,11],[12,12],[27,10],[27,11],[26,12]].forEach(([x,y])=>P(x,y,'#9fd3f5'));}
  if(has('sunglasses')){g.r(13,13,4,2,'#15131d');g.r(23,13,4,2,'#15131d');g.r(17,13,6,1,'#15131d');P(14,13,'#5b5780');P(24,13,'#5b5780');P(12,13,'#15131d');P(27,13,'#15131d');}
  if(o.outer==='rain')part(N(E(20,12,9,9.5),E(20,14.5,6.6,6.8)),O);
  if(has('beanie')){const BN=pal('beanie'),bm=E(20,10,8.8,7);part(N(bm,(x,y)=>y>9),BN);for(let x=10;x<=30;x++){if(bm(x,8))P(x,8,x%2?BN[1]:BN[0]);if(bm(x,9))P(x,9,x%2?BN[1]:BN[0]);}}
  if(has('scarf')){const SC=pal('scarf');part(Rc(13,19,26,23),SC);part(Tz(23,31,21,24,21,25),SC);g.r(21,26,4,1,SC[1]);g.r(21,29,4,1,SC[1]);}
  if(has('umbrella')&&!sit&&!kite){const UM=pal('umb');for(let y=0;y<=5;y++){const tt=(6-y)/6.2;const hw=14*Math.sqrt(Math.max(0,1-tt*tt));for(let x=0;x<W;x++){if(Math.abs(x+0.5-28.5)>hw)continue;if(y===5&&(x-15)%5===0)continue;P(x,y,y>=4?UM[1]:(x<22?UM[2]:UM[0]));}}}
  g.outline('#1c1a28');return g.url();});}
function itemSprite(kind,av){const A=av?avOf(av):AV;return pix('it2'+kind+avKey(A),()=>{const W=28,H=24,g=new Grid(W,H);
  const E=(cx,cy,rx,ry)=>(x,y)=>((x+0.5-cx)/rx)**2+((y+0.5-cy)/ry)**2<=1,Rc=(x0,y0,x1,y1)=>(x,y)=>x>=x0&&x<=x1&&y>=y0&&y<=y1;
  const Tz=(y0,y1,l0,r0,l1,r1)=>(x,y)=>{if(y<y0||y>y1)return false;const f=(y-y0)/Math.max(1,y1-y0);return x>=Math.round(l0+(l1-l0)*f)&&x<=Math.round(r0+(r1-r0)*f);};
  const U=(...ms)=>(x,y)=>ms.some(m=>m(x,y)),N=(a,b)=>(x,y)=>a(x,y)&&!b(x,y),P=(x,y,c)=>g.r(x,y,1,1,c);
  const part=(mask,[b,d,l])=>{for(let y=0;y<H;y++){let x=0;while(x<W){if(!mask(x,y)){x++;continue;}let x2=x;while(x2+1<W&&mask(x2+1,y))x2++;const n=x2-x+1;for(let i=x;i<=x2;i++){let c=b;if(n>=5&&i>=x2-1)c=d;else if(n>=3&&i===x2)c=d;else if(n>=4&&i===x)c=l;g.r(i,y,1,1,c);}x=x2+1;}}};
  const C=palOf(A,kind)||C3.tee,SKc=SKINS[A.skin],HRc=HAIRC[A.hairColor],torso=Tz(4,21,8,19,9,18),shortS=U(Tz(4,9,3,8,1,7),Tz(4,9,19,24,20,26)),longS=U(Tz(4,18,3,8,0,4),Tz(4,18,19,24,23,27)),neck=E(13.5,3.5,3.2,2.6);
  if(kind==='head'){part(E(14,13.5,7.5,8),SKc);part(E(6.8,14.5,1.2,1.8),SKc);part(E(21.2,14.5,1.2,1.8),SKc);part(U(N(E(14,11.5,8.6,7.6),(x,y)=>y>9),Rc(7,10,16,10),Rc(7,11,11,11),Rc(6,10,6,15),Rc(21,10,21,13)),HRc);g.r(9,13,1,2,'#1c1a28');g.r(18,13,1,2,'#1c1a28');P(13,17,'#6e2f2b');P(14,17,'#6e2f2b');P(12,16,'#6e2f2b');P(15,16,'#6e2f2b');}
  if(kind==='tee')part(N(U(torso,shortS),neck),C);
  if(kind==='tank')part(N(N(Tz(3,21,9,18,8,19),E(13.5,3,3.6,3.2)),U(E(8,6,2.5,4),E(19,6,2.5,4))),C);
  if(kind==='long'||kind==='sweater'){part(N(U(torso,longS),neck),C);[[0,5,18],[22,27,18]].forEach(([a,b,y])=>{for(let x=a;x<=b;x++)if(longS(x,y))P(x,y,C[1]);});if(kind==='sweater')for(let x=8;x<=19;x++)if(x%2)P(x,21,C[1]);}
  if(kind==='light'){part(N(U(torso,longS),neck),C);for(let y=6;y<=21;y++){P(13,y,C[1]);P(14,y,'#1c1a28');}[[10,4],[11,5],[12,6],[17,4],[16,5],[15,6]].forEach(([x,y])=>P(x,y,C[1]));g.r(9,13,3,1,C[1]);g.r(16,13,3,1,C[1]);}
  if(kind==='hoodie'){part(U(N(U(torso,longS),neck),N(E(13.5,3,5,3.4),E(13.5,4,2.4,2))),C);part(Tz(14,19,10,17,9,18),[C[1],C[1],C[0]]);g.r(12,5,1,4,'#e8e2d6');g.r(15,5,1,4,'#e8e2d6');}
  if(kind==='coat'||kind==='rain'){part(N(U(Tz(4,23,8,19,7,20),longS),neck),C);for(let y=5;y<=23;y++)P(13,y,C[1]);if(kind==='coat'){[8,13,18].forEach(y=>{P(11,y,'#e2c28a');P(16,y,'#e2c28a');});}else part(N(E(13.5,3,5,3.4),E(13.5,4,2.4,2)),C);}
  if(kind==='shorts'&&A.skirt){part(Tz(5,17,9,18,5,22),C);for(let x=6;x<=21;x+=3)P(x,17,C[1]);}
  else if(kind==='shorts')part(N(Tz(6,15,7,20,6,21),Tz(11,15,13,14,13,14)),C);
  if(kind==='pants')part(N(Tz(2,22,8,19,6,21),Tz(8,22,13,14,13,14)),C);
  if(kind==='shoe'){const SH=palOf(A,'shoe');part(U(E(8,15,5.5,3),Rc(4,12,9,15)),SH);part(U(E(20,15,5.5,3),Rc(16,12,21,15)),SH);g.r(3,17,11,1,'#8f877a');g.r(15,17,11,1,'#8f877a');P(6,13,'#8f877a');P(18,13,'#8f877a');}
  if(kind==='sunglasses'){g.r(4,10,8,5,'#15131d');g.r(16,10,8,5,'#15131d');g.r(12,11,4,1,'#15131d');g.r(1,10,3,1,'#15131d');g.r(24,10,3,1,'#15131d');P(5,11,'#5b5780');P(17,11,'#5b5780');}
  if(kind==='beanie'){const BN=palOf(A,'beanie'),bm=E(13.5,17,10,12);part(N(bm,(x,y)=>y>17),BN);for(let x=3;x<=24;x++)for(let y=16;y<=18;y++)if(E(13.5,17,10.5,12)(x,y-2)||y<=17)if(x>=4&&x<=23)P(x,y,x%2?BN[1]:BN[0]);part(E(13.5,4.5,2.6,2.4),palOf(A,'shoe'));}
  if(kind==='scarf'){const SC=palOf(A,'scarf');part(Tz(6,11,3,24,4,23),SC);part(Tz(11,21,15,19,15,20),SC);g.r(15,14,5,1,SC[1]);g.r(15,18,5,1,SC[1]);[15,17,19].forEach(x=>P(x,22,SC[1]));}
  if(kind==='umbrella'){for(let y=2;y<=9;y++){const tt=(10-y)/8.2,hw=12*Math.sqrt(Math.max(0,1-tt*tt));for(let x=0;x<W;x++){if(Math.abs(x+0.5-14)>hw)continue;if(y===9&&(x-2)%5===0)continue;P(x,y,y>=8?C3.umb[1]:(x<10?C3.umb[2]:C3.umb[0]));}}g.r(14,9,1,11,'#1c1a28');P(14,20,'#1c1a28');P(13,21,'#1c1a28');P(12,21,'#1c1a28');P(11,20,'#1c1a28');P(14,1,'#1c1a28');}
  g.outline('#1c1a28');return g.url();});}
function wearOf(o){const cap=w=>w[0].toUpperCase()+w.slice(1);const parts=[cap(nameOf(o.top||'tee'))];if(o.outer&&o.outer!=='none')parts.push(nameOf(o.outer));else if(o.bottom==='shorts')parts.push(nameOf('shorts'));const an=(o.acc||[]).map((a,i)=>i===0?a[0].toUpperCase()+a.slice(1):a);return {o:{top:o.top||'tee',outer:o.outer||'none',bottom:o.bottom||'pants',acc:o.acc||[]},wear:parts.join(' + ')+'.'+(an.length?' '+an.join(', ')+'.':'')};}
function outfitFor(t,c,w){
  const top=t>=78?'tank':t>=62?'tee':t>=50?'long':'sweater';
  const outer=c==='rain'?'rain':t<40?'coat':t<55?'hoodie':((t<68&&(w>=10||c==='partly'))||((c==='sunset'||c==='night')&&t<72))?'light':'none';
  const bottom=t>=70?'shorts':'pants';
  const acc=[];if(c==='sunny'||c==='partly'||c==='heat')acc.push('sunglasses');if(c==='rain')acc.push('umbrella');if(t<42)acc.push('beanie');if(t<35)acc.push('scarf');
  const TN={tank:'Tank',tee:'Tee',long:'Long sleeve',sweater:'Sweater'},ON={light:'light jacket',hoodie:'hoodie',coat:'coat',rain:'rain jacket'};
  const parts=[TN[top]];if(outer!=='none')parts.push(ON[outer]);else if(bottom==='shorts')parts.push('shorts');
  const an=acc.map((a,i)=>i===0?a[0].toUpperCase()+a.slice(1):a);
  return {o:{top,outer,bottom,acc},wear:parts.join(' + ')+'.'+(an.length?' '+an.join(', ')+'.':'')};
}

const svg=(inner,vb=24)=>'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}">${inner}</svg>`);
const CLOUDP='M7.2 19h9.9a4.1 4.1 0 0 0 .5-8.17A5.6 5.6 0 0 0 6.9 9.5 4.8 4.8 0 0 0 7.2 19z';
function sunG(cx,cy,r,rl,c){c=c||'#f6b93b';let d='';for(let k=0;k<8;k++){const a=k*Math.PI/4;d+=`M${(cx+Math.cos(a)*(r+2)).toFixed(1)} ${(cy+Math.sin(a)*(r+2)).toFixed(1)}L${(cx+Math.cos(a)*(r+2+rl)).toFixed(1)} ${(cy+Math.sin(a)*(r+2+rl)).toFixed(1)}`;}return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/><path d="${d}" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;}
const ICON_SRC={
  sunny:sunG(12,12,4.6,2.6),heat:sunG(12,12,5,2.6,'#e8603c'),
  sunset:`<path d="M3.5 17.5h17" stroke="#e8954f" stroke-width="1.8" stroke-linecap="round"/><path d="M6.8 17.5a5.2 5.2 0 0 1 10.4 0z" fill="#f6b93b"/><path d="M12 6.5v2.3M5.8 10l1.6 1.6M18.2 10l-1.6 1.6M3 14h2M19 14h2" stroke="#f6b93b" stroke-width="1.8" stroke-linecap="round"/>`,
  partly:sunG(15.5,8.5,3.4,1.8)+`<path d="${CLOUDP}" transform="translate(-1.5 1.5) scale(.92)" fill="#fff" stroke="#8a93a3" stroke-width="1.4"/>`,
  overcast:`<path d="${CLOUDP}" transform="translate(0 -1)" fill="#d7dce3" stroke="#7f8898" stroke-width="1.4"/>`,
  rain:`<path d="${CLOUDP}" transform="translate(0 -4)" fill="#b9c1cc" stroke="#6b7485" stroke-width="1.4"/><path d="M8 18l1 3M12 18l1 3M16 18l1 3" stroke="#3f7fc4" stroke-width="1.8" stroke-linecap="round"/>`,
  snow:`<path d="${CLOUDP}" transform="translate(0 -4)" fill="#eef2f6" stroke="#7f8898" stroke-width="1.4"/><g fill="#5b93d0"><circle cx="8" cy="19.5" r="1.2"/><circle cx="12" cy="21" r="1.2"/><circle cx="16" cy="19.5" r="1.2"/></g>`,
  night:`<path d="M19.5 14.8A8 8 0 1 1 9.2 4.5a6.4 6.4 0 0 0 10.3 10.3z" fill="#f3d27a" stroke="#c99a3a" stroke-width="1.2"/>`,
  fog:'<path d="M7 10h9.5a3.5 3.5 0 1 0-3.3-4.7A4 4 0 0 0 7 10z" fill="#e3e7ec" stroke="#8a93a3" stroke-width="1.3"/><path d="M3.5 14h17M5.5 17.5h13M8 21h8" stroke="#8a93a3" stroke-width="2" stroke-linecap="round"/>',
  drizzle:'<path d="'+CLOUDP+'" transform="translate(0 -4)" fill="#d7dce3" stroke="#7f8898" stroke-width="1.4"/><g fill="#5b93d0"><rect x="7" y="17.5" width="1.8" height="1.8"/><rect x="11.2" y="19.5" width="1.8" height="1.8"/><rect x="15.4" y="17.5" width="1.8" height="1.8"/></g>',
  storm:'<path d="'+CLOUDP+'" transform="translate(0 -4)" fill="#8a93a6" stroke="#4f5768" stroke-width="1.4"/><path d="M13 14l-4 5h3l-2 4 5-6h-3l2-3z" fill="#f6c93b" stroke="#b98a1a" stroke-width="0.8" stroke-linejoin="round"/>',
  sleet:'<path d="'+CLOUDP+'" transform="translate(0 -4)" fill="#d7dce3" stroke="#7f8898" stroke-width="1.4"/><path d="M8 18l1 2.5M16 18l1 2.5" stroke="#3f7fc4" stroke-width="1.8" stroke-linecap="round"/><circle cx="12.5" cy="20" r="1.4" fill="#9fc3ea" stroke="#5b93d0" stroke-width="0.8"/>',
  hail:'<path d="'+CLOUDP+'" transform="translate(0 -4)" fill="#9aa2b3" stroke="#5a6272" stroke-width="1.4"/><g fill="#fff" stroke="#6b7485" stroke-width="1"><circle cx="8" cy="19" r="1.7"/><circle cx="12.5" cy="21.2" r="1.7"/><circle cx="16.6" cy="18.6" r="1.7"/></g>',
  blizzard:'<path d="M9 3.5v12M4 6.5l10 6M4 12.5l10-6" stroke="#6f9bd1" stroke-width="1.7" stroke-linecap="round"/><path d="M13 17.5h6.5a2 2 0 1 0-2-2M9 21h10" stroke="#8a93a3" stroke-width="1.8" stroke-linecap="round" fill="none"/>',
  haze:'<circle cx="12" cy="9.5" r="5" fill="#e8954f"/><path d="M3 13.5h18M5 17h14M7 20.5h10" stroke="#b58a62" stroke-width="2.2" stroke-linecap="round"/>',
  humid:'<path d="M12 3.5c3.5 4.6 6 8 6 11a6 6 0 0 1-12 0c0-3 2.5-6.4 6-11z" fill="#8fc8ee" stroke="#3f7fc4" stroke-width="1.4"/><path d="M9.5 15a2.6 2.6 0 0 0 2.5 2.6" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none"/>',
  gust:'<path d="M3 9h10.5a2.8 2.8 0 1 0-2.8-2.8M3 13h15a2.8 2.8 0 1 1-2.8 2.8M3 17h6" fill="none" stroke="#5b8fd0" stroke-width="2" stroke-linecap="round"/>',
  cold:'<path d="M10 13.6V5.2a2 2 0 1 1 4 0v8.4a4 4 0 1 1-4 0z" fill="#f4f8fc" stroke="#4f7fb8" stroke-width="1.6"/><path d="M12 15.5v-2.5" stroke="#5b93d0" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16.8" r="1.9" fill="#5b93d0"/><path d="M19 3v6M16.4 4.5l5.2 3M16.4 7.5l5.2-3" stroke="#7fb0e6" stroke-width="1.3" stroke-linecap="round"/>',
  therm:`<path d="M10 13.6V5.2a2 2 0 1 1 4 0v8.4a4 4 0 1 1-4 0z" fill="none" stroke="${INK}" stroke-width="1.7"/><path d="M12 15.5V9" stroke="#dd6a58" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16.8" r="1.9" fill="#dd6a58"/>`,
  feels:`<circle cx="12" cy="6.5" r="2.8" fill="none" stroke="${INK}" stroke-width="1.7"/><path d="M6 20c.6-4.2 2.8-7 6-7s5.4 2.8 6 7" fill="none" stroke="${INK}" stroke-width="1.7" stroke-linecap="round"/>`,
  wind:`<path d="M3 9h10.5a2.8 2.8 0 1 0-2.8-2.8M3 13h15a2.8 2.8 0 1 1-2.8 2.8M3 17h6" fill="none" stroke="${INK}" stroke-width="1.7" stroke-linecap="round"/>`,
  clouds:`<path d="${CLOUDP}" fill="none" stroke="${INK}" stroke-width="1.7"/>`,
  shirt:`<path d="M8.5 3.5 3.5 6.5l2 3.8 2.5-1.2V20.5h8V9.1l2.5 1.2 2-3.8-5-3a3.5 3.5 0 0 1-7 0z" fill="#dfe9f4" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
  cal:`<rect x="4" y="5.5" width="16" height="14.5" rx="2.5" fill="none" stroke="${INK}" stroke-width="1.7"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" stroke="${INK}" stroke-width="1.7" stroke-linecap="round"/>`,
  tune:`<path d="M4 7h16M4 17h16" stroke="${INK}" stroke-width="1.7" stroke-linecap="round"/><circle cx="9" cy="7" r="2.4" fill="${CREAM}" stroke="${INK}" stroke-width="1.7"/><circle cx="15" cy="17" r="2.4" fill="${CREAM}" stroke="${INK}" stroke-width="1.7"/>`,
  best:sunG(12,12,4,3,'#f2b52e'),
};
const icon=k=>pix('i'+k,()=>svg(ICON_SRC[k]));
function windDial(dir,dk){return pix('wd'+dir+dk,()=>{const c=dk?'#f3efe6':INK,tr=dk?'rgba(255,255,255,0.25)':'rgba(39,35,58,0.18)';let tk='';for(let i=0;i<8;i++){const a=i*Math.PI/4,r1=i%2?15.5:14,r2=17;tk+='<line x1="'+(20+Math.sin(a)*r1).toFixed(1)+'" y1="'+(20-Math.cos(a)*r1).toFixed(1)+'" x2="'+(20+Math.sin(a)*r2).toFixed(1)+'" y2="'+(20-Math.cos(a)*r2).toFixed(1)+'" stroke="'+c+'" stroke-width="'+(i%2?1:1.8)+'" stroke-linecap="round"/>';}
  return svg('<circle cx="20" cy="20" r="18" fill="none" stroke="'+tr+'" stroke-width="2"/>'+tk+'<g transform="rotate('+((dir+180)%360)+' 20 20)"><path d="M20 7l5 11h-3.2v14h-3.6V18H15z" fill="#e8954f" stroke="'+c+'" stroke-width="1.2" stroke-linejoin="round"/></g>',40);});}
function cloudRing(p,dk){return pix('cr'+p+dk,()=>{const tr=dk?'rgba(255,255,255,0.22)':'rgba(39,35,58,0.14)',L=2*Math.PI*15;return svg('<circle cx="20" cy="20" r="15" fill="none" stroke="'+tr+'" stroke-width="6"/><circle cx="20" cy="20" r="15" fill="none" stroke="'+(dk?'#c9d2e6':'#8a95a8')+'" stroke-width="6" stroke-dasharray="'+(L*p/100).toFixed(1)+' '+L.toFixed(1)+'" transform="rotate(-90 20 20)" stroke-linecap="'+(p>2&&p<98?'round':'butt')+'"/><circle cx="20" cy="20" r="6" fill="'+(p<35?'#f6b93b':dk?'#c9d2e6':'#b7c0cd')+'"/>',40);});}
const iconT=(k,dk)=>dk?pix('id'+k,()=>svg(ICON_SRC[k].split(INK).join('#f3efe6'))):icon(k);
function face(n){return pix('f'+n,()=>{
  const eyes=n===4?`<path d="M9.5 13.8q1.8-2.2 3.6 0M18.9 13.8q1.8-2.2 3.6 0" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`:`<circle cx="11.3" cy="13" r="1.6" fill="${INK}"/><circle cx="20.7" cy="13" r="1.6" fill="${INK}"/>`;
  const M=['M10.5 23.5q5.5-5 11 0','M11.5 22.5q4.5-2.5 9 0','M11.5 21h9','M11 19.5q5 4 10 0','M9.8 18.5q6.2 8 12.4 0z'];
  const mouth=n===4?`<path d="${M[4]}" fill="${INK}"/>`:`<path d="${M[n]}" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
  const brows=n===0?`<path d="M8.5 9.5l4 1.3M23.5 9.5l-4 1.3" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`:'';
  return svg(`<circle cx="16" cy="16" r="14" fill="${STRONG[n]}"/>${eyes}${mouth}${brows}`,32);});}

function graphSvg(curve,sel,best,W,H,dark){
  const top=24,bot=20,X=i=>(i+0.5)*W/12;
  const lo=Math.max(0,Math.floor((Math.min(...curve)-12)/10)*10),hi=Math.min(100,Math.ceil((Math.max(...curve)+6)/10)*10);
  const Y=v=>top+(hi-v)/(hi-lo)*(H-top-bot);
  const pts=curve.map((v,i)=>[X(i),Y(v)]);const f=n=>n.toFixed(1);
  let d=`M${f(pts[0][0])} ${f(pts[0][1])}`;
  for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;d+=` C${f(p1[0]+(p2[0]-p0[0])/6)} ${f(p1[1]+(p2[1]-p0[1])/6)} ${f(p2[0]-(p3[0]-p1[0])/6)} ${f(p2[1]-(p3[1]-p1[1])/6)} ${f(p2[0])} ${f(p2[1])}`;}
  const area=d+` L${f(X(11))} ${H-bot} L${f(X(0))} ${H-bot} Z`;
  const grid=dark?'rgba(255,255,255,0.18)':'rgba(39,35,58,0.13)',bg=dark?'#2a2e4a':'#fbf7ee';
  let gl='';for(let v=Math.ceil(lo/20)*20;v<=hi;v+=20){if(v===lo)continue;gl+=`<line x1="0" x2="${W}" y1="${f(Y(v))}" y2="${f(Y(v))}" stroke="${grid}" stroke-dasharray="2 4"/>`;}
  const stops=[[0,4],[0.15,4],[0.3,3],[0.45,2],[0.6,1],[1,0]].map(([o,b])=>`<stop offset="${o}" stop-color="${STRONG[b]}"/>`).join('');
  const gy1=Y(100),gy0=Y(0);
  let marks='';curve.forEach((v,i)=>{const [x,y]=pts[i];if(i===sel)return;const s=i===best?7:4;marks+=`<rect x="${f(x-s/2)}" y="${f(y-s/2)}" width="${s}" height="${s}" fill="${STRONG[band(v)]}" stroke="${bg}" stroke-width="1.5"/>`;});
  const [sx,sy]=pts[sel];
  const bestLine=`<line x1="${f(X(best))}" x2="${f(X(best))}" y1="16" y2="${H-bot}" stroke="${dark?'rgba(255,255,255,0.35)':'rgba(39,35,58,0.25)'}" stroke-dasharray="3 3"/>`;
  const selLine=`<line x1="${f(sx)}" x2="${f(sx)}" y1="${f(sy)}" y2="${H-bot}" stroke="${STRONG[band(curve[sel])]}" stroke-width="2"/>`;
  const selMark=`<rect x="${f(sx-6)}" y="${f(sy-6)}" width="12" height="12" fill="${bg}" stroke="${STRONG[band(curve[sel])]}" stroke-width="3"/>`;
  const wrap=inner=>'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${inner}</svg>`);
  return {src:wrap(`<defs><linearGradient id="g" x1="0" y1="${f(gy1)}" x2="0" y2="${f(gy0)}" gradientUnits="userSpaceOnUse">${stops}</linearGradient><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0.15"/></linearGradient><mask id="m"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask></defs>${gl}<path d="${area}" fill="url(#g)" opacity="0.32" mask="url(#m)"/>${bestLine}${selLine}<path d="${d}" fill="none" stroke="url(#g)" stroke-width="3.5" stroke-linecap="round"/>${marks}${selMark}`),selY:sy,X,Y};
}

const hx2=h=>h;const hx=h=>{const n=parseInt(h.slice(1),16);return [n>>16,(n>>8)&255,n&255];};
const mix=(a,b,t)=>{const A=hx(a),B=hx(b);return 'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')+')';};
const rgba=(h,a)=>{const A=hx(h);return `rgba(${A[0]},${A[1]},${A[2]},${a})`;};
const PAL={
  sunny:{sky:['#3f8fd8','#86bdea','#d9eef8'],sun:1,caps:0.55,land:'#6fae55',dark:'#3d7a3a',g0:'#86c162',g1:'#4f8c40',blades:['#5d9c44','#77b556','#93cb6c'],cloud:'#ffffff',shade:'#dbe7f2',path:'#d9c48f',house:'#f2e3c4',roof:'#c95b4a',flowers:1},
  partly:{sky:['#4f88c6','#98bfe2','#dde9f2'],sun:1,caps:0.55,land:'#6aa653',dark:'#3b733a',g0:'#80b95f',g1:'#4c863f',blades:['#5a9643','#74b054','#8dc468'],cloud:'#fbfbf8',shade:'#cfdbe7',path:'#d2bf8e',house:'#f2e3c4',roof:'#c95b4a',flowers:1,leaves:1},
  sunset:{sky:['#2f2a63','#c9607a','#f7a35c'],sun:1,sunset:1,caps:0.3,land:'#5f6b45',dark:'#2f3326',g0:'#6f7446',g1:'#3f4230',blades:['#5e6436','#757b42','#8d9250'],cloud:'#f4b59a',shade:'#c9788a',path:'#b58a62',house:'#8a6a66',roof:'#5a3040',lit:1,flowers:1},
  heat:{sky:['#79acd4','#c3dae2','#f4e6c2'],sun:1,heat:1,land:'#a8ad5a',dark:'#6b733a',g0:'#bdb86a',g1:'#8e8745',blades:['#a39b4e','#b9b05c','#cbc16b'],cloud:'#ffffff',shade:'#eeeeee',path:'#e0cf9a',house:'#f2e3c4',roof:'#c95b4a'},
  overcast:{sky:['#78839a','#a4adba','#cfd3d9'],ceil:1,fog:0.4,caps:0.45,land:'#7c9470',dark:'#4c6146',g0:'#88a07a',g1:'#5a7150',blades:['#61785a','#788f6c','#8ea57f'],cloud:'#c7ccd4',shade:'#a8b0bc',path:'#b9ad8e',house:'#e3d6bc',roof:'#9c5a4f',smoke:1,leaves:1},
  rain:{sky:['#434d62','#6b7488','#99a0ad'],ceil:1,fog:0.45,land:'#5d7c57',dark:'#344b33',g0:'#6a8a60',g1:'#3f5a3b',blades:['#4c6848','#5f7f58','#739268'],cloud:'#6d7587',shade:'#565e6e',path:'#8f8670',house:'#cfc3aa',roof:'#8a4c44',rain:1,smoke:1,lit:1},
  snow:{sky:['#8aa1bb','#bccada','#e6ebf1'],ceil:1,fog:0.35,caps:1,land:'#e7edf3',dark:'#9fb0c2',g0:'#f4f7fa',g1:'#d3dde7',blades:['#a3957b','#bcae90'],sparse:1,cloud:'#e6ebf0',shade:'#c5ced8',path:'#dfe6ee',house:'#dccbaa',roof:'#f4f7fa',snow:1,smoke:1,lit:1,snowy:1},
  night:{sky:['#0d1230','#242d58','#46507e'],moon:1,stars:1,land:'#2e4c47',dark:'#18292a',g0:'#28463d',g1:'#132520',blades:['#1f3a31','#2a4b3e','#34594a'],cloud:'#3a4272',shade:'#2e3561',path:'#3d4a44',house:'#5b5673',roof:'#6f3d45',flies:1,lit:1,smoke:1},
};

function drawScene(ctx,W,H,cond,t,g,seed,wind,bigTree,px,fx){
  const Z=fx&&fx.zoom?+fx.zoom:1;const P=climPal(cond,fx&&fx.season),hz=P.sky[2],sc=Math.max(0.35,Math.min(1.3,g/560))*Z,hs=Math.max(40,Math.min(g*0.36,280))*Z;
  const circ=(x,y,r)=>{ctx.moveTo(x+r,y);ctx.arc(x,y,Math.max(0.1,r),0,Math.PI*2);};
  let gr=ctx.createLinearGradient(0,0,0,g);gr.addColorStop(0,P.sky[0]);gr.addColorStop(0.62,P.sky[1]);gr.addColorStop(1,hz);ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  if(P.stars){ctx.fillStyle='#fff7da';for(let i=0;i<Math.min(180,W/4);i++){ctx.globalAlpha=0.2+0.8*Math.abs(Math.sin(t*(0.5+rnd(i)*1.4)+i));const s=Math.max(px,rnd(i*5)>0.9?2:1.2);ctx.fillRect(rnd(i*3+seed)*W,rnd(i*7+2)*g*0.8,s,s);}ctx.globalAlpha=1;
    const cyc=Math.floor(t/4.5),ph=(t/4.5)%1;if(ph<0.2){const p=ph/0.2,x0=W*(0.15+rnd(cyc)*0.55),y0=g*(0.08+rnd(cyc+9)*0.2),L=Math.max(80,W*0.12);const x=x0+p*L,y=y0+p*L*0.35;const sg=ctx.createLinearGradient(x-L*0.4,y-L*0.14,x,y);sg.addColorStop(0,'rgba(255,247,218,0)');sg.addColorStop(1,`rgba(255,247,218,${1-p})`);ctx.strokeStyle=sg;ctx.lineWidth=Math.max(px,1.5);ctx.beginPath();ctx.moveTo(x-L*0.4,y-L*0.14);ctx.lineTo(x,y);ctx.stroke();}}
  let sx=W*0.8,sy=Math.max(28,g*0.26),sr=Math.max(9,22*sc);
  if(P.sunset){sx=fx&&fx.ax?Math.min(W-40,+fx.ax+70*sc):W*0.6;sy=g-hs*0.62;sr*=1.9;}
  if(P.heat){sr*=1.35;sy=Math.max(34,g*0.2);}
  if(fx&&fx.skycap&&!P.sunset){sx=W*(+fx.sunx||0.84);sy=Math.max(110,g*0.17);}
  if(P.sun||P.moon){const gl=ctx.createRadialGradient(sx,sy,0,sx,sy,sr*(P.heat?9:7));gl.addColorStop(0,P.sunset?'rgba(255,190,120,0.8)':P.heat?'rgba(255,250,225,0.95)':P.sun?'rgba(255,236,170,0.7)':'rgba(240,230,190,0.35)');gl.addColorStop(1,'rgba(255,236,170,0)');ctx.fillStyle=gl;ctx.fillRect(sx-sr*9,sy-sr*9,sr*18,sr*18);
    ctx.fillStyle=P.sunset?'#ffd7a0':P.heat?'#fffbe8':P.sun?'#fff0b8':'#f3ecd0';ctx.beginPath();circ(sx,sy,sr);ctx.fill();
    if(P.sunset){ctx.fillStyle='rgba(247,163,92,0.55)';for(let k=1;k<4;k++)ctx.fillRect(sx-sr,sy+sr*(0.2+k*0.22),sr*2,Math.max(px,sr*0.08));}
    if(P.moon){const mp=(((Date.now()-Date.UTC(2000,0,6,18,14))/864e5)/29.530588%1+1)%1;const off=sr*2.1*(1-Math.abs(1-2*mp))*(mp<0.5?-1:1);if(Math.abs(off)<sr*2.05){ctx.fillStyle=mix(P.sky[0],P.sky[1],0.5);ctx.beginPath();circ(sx+off,sy-sr*0.12,sr*1.02);ctx.fill();}ctx.fillStyle='rgba(180,170,140,0.35)';[[-0.3,-0.2,0.22],[0.25,0.3,0.16],[0.1,-0.45,0.12]].forEach(([a,b,r])=>{if(Math.abs(off)>=sr*1.2||Math.sign(off)!==Math.sign(a)){ctx.beginPath();circ(sx+a*sr,sy+b*sr,r*sr);ctx.fill();}});}}
  if(fx&&fx.skycap){const cx=+fx.capx||W/2,y=+fx.capy||92,txt=fx.skycap.toUpperCase();ctx.textAlign=fx.capal||'center';ctx.textBaseline='alphabetic';ctx.font="800 30px 'Rethink Sans',sans-serif";try{ctx.letterSpacing='3px';}catch(e){}
    ctx.lineJoin='round';ctx.strokeStyle=mix(P.sky[0],'#101226',0.45);ctx.lineWidth=px*2.2;ctx.strokeText(txt,cx,y);ctx.fillStyle='#ffffff';ctx.fillText(txt,cx,y);try{ctx.letterSpacing='0px';}catch(e){}}
  const cs=(5+wind*1.8)*Math.max(0.5,sc);
  const cloud=(x,y,w,c,s,a)=>{ctx.globalAlpha=a;[[s,w*0.05],[c,0]].forEach(([col,oy])=>{ctx.fillStyle=col;ctx.beginPath();circ(x+w*0.28,y+oy,w*0.2);circ(x+w*0.52,y+oy-w*0.1,w*0.26);circ(x+w*0.76,y+oy,w*0.18);ctx.fill();ctx.beginPath();ctx.roundRect(x+w*0.06,y+oy-w*0.02,w*0.88,w*0.2,w*0.1);ctx.fill();});ctx.globalAlpha=1;};
  // high cloud (fx.cirrus, %): thin feathered streaks high up, drifting slowly; at sunset they catch the light
  const CI=fx&&fx.cirrus!=null&&fx.cirrus!==''?Math.max(0,Math.min(100,+fx.cirrus)):0;
  if(CI>=4&&!P.ceil){const n=Math.round((1+CI/100*13)*Math.max(0.55,W/1280)),glow=P.sunset?1:0,nite=cond==='night';
    for(let i=0;i<n;i++){const y=g*(0.03+rnd(i*11+seed*5+1)*0.2),len=(180+rnd(i*3+2)*280)*Math.max(0.6,sc),th=(2.5+rnd(i*7+3)*4)*Math.max(0.6,sc);
      const span=W+len*2,x=((rnd(i*17+seed+4)*span+t*cs*0.22)%span)-len,tilt=(rnd(i*5)-0.5)*0.12;
      // higher streaks go pink at sunset, lower ones orange, as the light comes in under them
      const hue=y/(g*0.25),col=glow?[255,Math.round(150+hue*50),Math.round(150-hue*40)]:nite?[190,196,220]:[255,255,255],amax=glow?0.8:nite?0.18:0.55;
      ctx.save();ctx.translate(x,y);ctx.rotate(tilt);
      for(let k=0;k<5;k++){const yy=k*th*0.8+Math.sin(k*1.9+i)*th*0.5,x0=k*len*0.05+rnd(i*9+k)*len*0.08,l2=len*(1-k*0.1);
        const gr=ctx.createLinearGradient(x0,0,x0+l2,0),a=amax*(1-k*0.15);gr.addColorStop(0,`rgba(${col},0)`);gr.addColorStop(0.25+rnd(i+k*3)*0.3,`rgba(${col},${a})`);gr.addColorStop(1,`rgba(${col},0)`);
        ctx.fillStyle=gr;ctx.fillRect(x0,yy,l2,Math.max(px,th*(0.35+rnd(i*4+k)*0.3)));}
      ctx.restore();}}
  // cloud cover (fx.clouds, 0-100), when we know it, sets how many of the usual puffs drift by; without it the sky type decides
  const CV=fx&&fx.clouds!=null&&fx.clouds!==''?Math.max(0,Math.min(100,+fx.clouds)):null;
  const deckA=P.ceil?1:0;
  if(deckA>0&&!(fx&&fx.precip==='none')){const step=Math.max(60,120*sc);ctx.save();ctx.globalAlpha=deckA;[[P.shade,0.3,0.9],[P.cloud,0.45,1]].forEach(([col,spd,a],row)=>{const tt=t*cs*spd,base=Math.floor(tt/step),off=tt-base*step;for(let j=-2;j<W/step+2;j++){const k=j-base;const w=step*(1.7+rnd(k*5+row)*0.7);cloud(j*step+off-w*0.3,g*(0.02+row*0.05)+rnd(k*3+seed+row*7)*g*0.07,w,col,P.shade,a*deckA);}});ctx.restore();
    if(P.ceil){const hzg=ctx.createLinearGradient(0,0,0,g*0.35);hzg.addColorStop(0,rgba(P.sky[0],0.35));hzg.addColorStop(1,rgba(P.sky[0],0));ctx.fillStyle=hzg;ctx.fillRect(0,0,W,g*0.35);}}
  const CN=CV!=null&&!P.ceil?Math.round((CV<3?0:1+Math.pow(CV/100,1.3)*56)*Math.max(0.55,W/1280)):({sunny:3,partly:6,sunset:3,heat:0,overcast:4,rain:4,snow:4,night:3}[cond]??3);
  for(let i=0;i<CN;i++){const far=i%2===1;const grow=1;const w=(70+rnd(i*7+seed*13)*90)*Math.max(0.45,sc)*(far?0.65:1)*grow;const y=g*(P.ceil?0.22:0.06)+rnd(i*5+seed*3+2)*g*(P.sunset?0.25:CV!=null?0.34:0.36);const sp=cs*(far?0.55:1)*(0.75+rnd(i*9)*0.5);const span=W+w*2;const x=((rnd(i*13+seed)*span+t*sp)%span)-w;cloud(x,y,w,P.cloud,P.shade,far?0.72:0.95);}
  const ridge=a=>0.6*(1-Math.abs(Math.sin(a)))+0.3*(1-Math.abs(Math.sin(a*2.3+1.3)))+0.1*(0.5+0.5*Math.sin(a*6.1));
  const shape=fn=>{ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W+3;x+=3)ctx.lineTo(x,fn(x/W));ctx.lineTo(W+3,H);ctx.closePath();};
  const haze=(y1,y2,a)=>{const h=ctx.createLinearGradient(0,y1,0,y2);h.addColorStop(0,rgba(hz,0));h.addColorStop(1,rgba(hz,a));ctx.fillStyle=h;ctx.fillRect(0,y1,W,y2-y1);};
  let L0=u=>g-hs*(0.34+0.6*ridge(u*6.2+seed*0.7)),RG=null;
  if(fx&&fx.curve){const cv=fx.curve.split(',').map(Number),lo=Math.min(...cv)-10,hi=Math.max(...cv)+4,X0=0.06,X1=0.94,Hv=v=>0.3+0.66*(v-lo)/(hi-lo);
    L0=u=>{const q=Math.max(0,Math.min(11,(u-X0)/(X1-X0)*11)),i=Math.min(10,Math.floor(q)),f=q-i,c=(1-Math.cos(f*Math.PI))/2;const h=Hv(cv[i])*(1-c)+Hv(cv[i+1])*c;const e=u<X0?(X0-u)/X0:u>X1?(u-X1)/(1-X1):0;return g-hs*(h*(1-e*0.45)+0.018*Math.sin(u*97+seed)*Math.sin(u*31));};
    RG={cv,X0,X1,Hv};}
  shape(L0);ctx.fillStyle=mix(P.land,hz,RG?0.56:(P.sunset?0.55:0.68));ctx.fill();
  if(RG){ctx.globalAlpha=fx.ra==null||fx.ra===''?1:+fx.ra;const best=+fx.best,sel=+fx.sel;ctx.save();shape(L0);ctx.clip();const rg=ctx.createLinearGradient(0,g-hs,0,g-hs*0.2);rg.addColorStop(0,'rgba(255,255,255,0.28)');rg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=rg;ctx.fillRect(0,0,W,g);ctx.restore();
    ctx.lineCap='round';for(let x=W*RG.X0;x<W*RG.X1;x+=px*2){const q=(x/W-RG.X0)/(RG.X1-RG.X0)*11,i=Math.min(10,Math.floor(q)),f=q-i,v=RG.cv[i]*(1-f)+RG.cv[i+1]*f;ctx.strokeStyle='rgba(255,255,255,0.55)';ctx.lineWidth=px*3.2;ctx.beginPath();ctx.moveTo(x,L0(x/W));ctx.lineTo(x+px*2,L0((x+px*2)/W));ctx.stroke();ctx.strokeStyle=STRONG[band(v)];ctx.lineWidth=px*1.6;ctx.beginPath();ctx.moveTo(x,L0(x/W));ctx.lineTo(x+px*2,L0((x+px*2)/W));ctx.stroke();}
    RG.cv.forEach((v,i)=>{const x=W*(RG.X0+i*(RG.X1-RG.X0)/11),y=L0(x/W);ctx.fillStyle='#ffffff';ctx.fillRect(x-px*2,y-px*2,px*4,px*4);ctx.fillStyle=STRONG[band(v)];ctx.fillRect(x-px*1.2,y-px*1.2,px*2.4,px*2.4);});
    if(sel!==best){const x=W*(RG.X0+sel*(RG.X1-RG.X0)/11),y=L0(x/W);ctx.strokeStyle='rgba(255,255,255,0.8)';ctx.lineWidth=px;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,g-hs*0.1);ctx.stroke();ctx.fillStyle='#ffffff';ctx.beginPath();circ(x,y,7*sc);ctx.fill();ctx.fillStyle=STRONG[band(RG.cv[sel])];ctx.beginPath();circ(x,y,4.5*sc);ctx.fill();}ctx.globalAlpha=1;}
  if(P.caps&&!RG){ctx.save();shape(L0);ctx.clip();ctx.fillStyle=`rgba(255,255,255,${0.9*P.caps})`;ctx.beginPath();ctx.moveTo(0,0);for(let x=0;x<=W+3;x+=3){const u=x/W;ctx.lineTo(x,g-hs*0.72+Math.sin(u*60+seed)*3*sc+Math.sin(u*17)*4*sc);}ctx.lineTo(W+3,0);ctx.closePath();ctx.fill();ctx.restore();}
  haze(g-hs*0.6,g-hs*0.2,0.55);
  {const night=cond==='night',warm=P.sunset,cc=night?'#1b2144':warm?mix(P.dark,hz,0.3):mix(P.dark,hz,0.52),win=night?'rgba(255,214,130,0.9)':warm?'rgba(255,200,130,0.75)':'rgba(255,255,255,0.4)';
    const baseY=g-hs*0.19,k=Math.max(0.55,sc)*1.5;let x=W*0.4,i=0;const x1=W*0.86;
    while(x<x1){const bw=(7+rnd(i*5+seed)*9)*k;const cen=Math.max(0,1-Math.abs((x-W*0.62)/(W*0.24)));const bh=(12+rnd(i*7+3)*22+cen*40)*k;ctx.fillStyle=cc;ctx.fillRect(x,baseY-bh,bw-Math.max(px,0.8*k),bh+hs*0.2);
      const rt=rnd(i*11+2);if(rt>0.82){ctx.fillRect(x+bw*0.42,baseY-bh-9*k,Math.max(px,1.4*k),9*k);if(Math.floor(t*1.3+i)%2){ctx.fillStyle='#ff5a4a';ctx.fillRect(x+bw*0.42-0.4*k,baseY-bh-10*k,Math.max(px,2*k),Math.max(px,2*k));}}
      else if(rt>0.66){ctx.beginPath();ctx.moveTo(x,baseY-bh);ctx.lineTo(x+(bw-0.8*k)/2,baseY-bh-bw*0.45);ctx.lineTo(x+bw-0.8*k,baseY-bh);ctx.closePath();ctx.fill();}
      ctx.fillStyle=win;const ws=Math.max(px,1.6*k),gp=Math.max(px*2,3.6*k);let ri=0;for(let wy=baseY-bh+gp*0.6;wy<baseY-gp*0.4;wy+=gp,ri++){let ci=0;for(let wx=x+gp*0.45;wx<x+bw-gp*0.5;wx+=gp,ci++){const wid=i*997+ri*31+ci;if(rnd(wid*1.7+seed)<(night||warm?0.28:0.45))continue;if(night||warm){const cid=i*131+Math.floor(ri/2)*17+Math.floor(ci/2)*5;const per=5+rnd(cid*3.3)*9,ep=Math.floor(t/per+rnd(cid+7)*10);if(rnd(cid*5.1+ep*2.3)<0.4)continue;}ctx.fillRect(wx,wy,ws,ws);}}
      x+=bw;i++;}
    const ch=ctx.createLinearGradient(0,baseY-hs*0.35,0,baseY);ch.addColorStop(0,rgba(hz,0));ch.addColorStop(1,rgba(hz,night?0.15:0.35));ctx.fillStyle=ch;ctx.fillRect(W*0.38,baseY-hs*0.5,W*0.5,hs*0.5);}
  if(RG){const k=Math.max(0.6,sc),cab=mix(P.dark,'#2b2340',0.3),night=cond==='night';
    const gondola=(x1,y1,x2,y2,ph,cols,stationOnRoof)=>{
      ctx.fillStyle=cab;ctx.beginPath();ctx.moveTo(x1-8*k,y1);ctx.lineTo(x1-2*k,y1-30*k);ctx.lineTo(x1+2*k,y1-30*k);ctx.lineTo(x1+8*k,y1);ctx.closePath();ctx.fill();ctx.fillRect(x1-7*k,y1-30*k,14*k,3*k);
      if(stationOnRoof){ctx.fillStyle=cab;ctx.fillRect(x2-10*k,y2-12*k,20*k,12*k);ctx.fillRect(x2-12*k,y2-14*k,24*k,3*k);ctx.fillStyle=night?'#ffd27a':mix(P.house,hz,0.2);ctx.fillRect(x2-7*k,y2-9*k,5*k,4*k);ctx.fillRect(x2+2*k,y2-9*k,5*k,4*k);}
      else{ctx.fillStyle=cab;ctx.fillRect(x2-12*k,y2,24*k,14*k);ctx.fillStyle=night?'#ffd27a':mix(P.house,hz,0.2);ctx.fillRect(x2-9*k,y2+4*k,6*k,5*k);ctx.fillRect(x2+3*k,y2+4*k,6*k,5*k);}
      const ax=x1,ay=y1-29*k,bx=x2,by=stationOnRoof?y2-13*k:y2+1*k,P2=p=>[ax+(bx-ax)*p,ay+(by-ay)*p+Math.sin(p*Math.PI)*16*k];
      [-3,3].forEach(o=>{ctx.strokeStyle=rgba('#2b2340',0.55);ctx.lineWidth=Math.max(px*0.5,1);ctx.beginPath();for(let q=0;q<=20;q++){const [x,y]=P2(q/20);q?ctx.lineTo(x,y+o*0.3*k):ctx.moveTo(x,y+o*0.3*k);}ctx.stroke();});
      cols.forEach((c,ci)=>{const p=(Math.sin(t*0.22+ph+ci*Math.PI)+1)/2*0.86+0.07,[x,y]=P2(p),sw=Math.sin(t*1.4+ci+ph)*0.08*Math.min(1.5,wind/8+0.3);ctx.save();ctx.translate(x,y);ctx.rotate(sw);ctx.fillStyle='#3b2a2a';ctx.fillRect(-0.8*k,0,Math.max(px*0.6,1.6*k),8*k);ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(-8*k,8*k,16*k,13*k,3*k);ctx.fill();ctx.fillStyle=night?'#ffe6a8':'#cfe8f5';ctx.fillRect(-6*k,11*k,5*k,5*k);ctx.fillRect(1*k,11*k,5*k,5*k);ctx.restore();});};
    const ck=Math.max(0.55,sc)*1.5,cBase=g-hs*0.19,bw0=(7+rnd(seed)*9)*ck,cen0=Math.max(0,1-Math.abs((W*0.4-W*0.62)/(W*0.24))),bh0=(12+rnd(3)*22+cen0*40)*ck;
    const bu=fx.bu!=null&&fx.bu!==''?+fx.bu:0.06+(+fx.best||0)*0.08;
    gondola(W*0.8,L0(0.8)+2,W*0.6,cBase-26*ck,0,['#e8604c','#f2c230'],false);
    gondola(W*bu,L0(bu)+2,W*0.4+bw0*0.45,cBase-bh0,1.7,['#4f8fbf','#7fb556'],true);}
  const L1=u=>g-hs*(0.2+0.14*(0.5+0.35*Math.sin(u*8+seed*2)+0.15*Math.sin(u*21+seed)));
  shape(L1);ctx.fillStyle=mix(P.land,hz,0.46);ctx.fill();
  haze(g-hs*0.32,g-hs*0.08,0.4);
  const L2=u=>g-hs*(0.08+0.07*(0.5+0.5*Math.sin(u*5.5+seed+2)));
  shape(L2);ctx.fillStyle=mix(P.land,hz,0.24);ctx.fill();
  const [SEA,CLIM]=splitSea(fx&&fx.season),BARE=CLIM==='winter',FALL=!BARE&&(CLIM==='autumn'||SEA==='autumn'||SEA==='halloween');const tc1=FALL?mix('#d9772e',hz,0.28):SEA==='spring'?mix('#f0a3c2',hz,0.2):mix(P.dark,hz,0.3),tc2=FALL?mix('#b8452e',hz,0.32):SEA==='spring'?mix('#e38aae',hz,0.25):mix(P.dark,hz,0.45),nT=Math.round(Math.min(60,W/16));
  for(let i=0;i<nT;i++){if(rnd(i*19+seed)>0.68)continue;const u=(i+rnd(i*3+seed))/nT;if(u>0.84&&u<0.97)continue;const x=u*W,y=L2(u)+2,h=(12+rnd(i*7+seed)*16)*sc;const s=(wind*0.02+Math.sin(t*(1+wind*0.06)+i*1.7)*(0.015+wind*0.005))*h;ctx.fillStyle=i%3?tc1:tc2;
    if(rnd(i*11+seed)>0.45){ctx.beginPath();ctx.moveTo(x-h*0.28,y);ctx.lineTo(x+h*0.28,y);ctx.lineTo(x+s,y-h);ctx.closePath();ctx.fill();if(P.snowy){ctx.fillStyle='rgba(255,255,255,0.85)';ctx.beginPath();ctx.moveTo(x+s*0.8-h*0.1,y-h*0.7);ctx.lineTo(x+s*0.8+h*0.1,y-h*0.7);ctx.lineTo(x+s,y-h);ctx.closePath();ctx.fill();}}
    else if(BARE){ctx.strokeStyle=mix('#5a4636',hz,0.35);ctx.lineWidth=Math.max(px*0.8,1.2*sc);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+s*0.5,y-h*0.85);[[0.35,-0.3],[0.5,0.28],[0.65,-0.22],[0.78,0.18]].forEach(([f,d])=>{const bx=x+s*0.5*f,by=y-h*0.85*f;ctx.moveTo(bx,by);ctx.lineTo(bx+d*h*0.6+s*0.3,by-h*0.25);});ctx.stroke();}else{ctx.fillRect(x-0.8*sc,y-h*0.4,1.6*sc+0.5,h*0.4);ctx.beginPath();circ(x+s*0.6,y-h*0.55,h*0.34);ctx.fill();}}
  const hu=0.905,hxp=W*hu,hy=L2(hu)+2,hw=Math.max(14,30*sc),hh=hw*0.62;
  ctx.fillStyle=mix(P.house,hz,0.12);ctx.fillRect(hxp-hw/2,hy-hh,hw,hh);
  ctx.fillStyle=mix(P.roof,hz,0.12);ctx.fillRect(hxp+hw*0.18,hy-hh-hw*0.38,hw*0.12,hw*0.3);
  ctx.beginPath();ctx.moveTo(hxp-hw*0.6,hy-hh);ctx.lineTo(hxp+hw*0.6,hy-hh);ctx.lineTo(hxp,hy-hh-hw*0.42);ctx.closePath();ctx.fill();
  ctx.fillStyle='#6b4f3a';ctx.fillRect(hxp-hw*0.32,hy-hh*0.62,hw*0.18,hh*0.62);
  ctx.fillStyle=P.lit?'#ffd27a':'#9fbfdc';ctx.fillRect(hxp+hw*0.06,hy-hh*0.72,hw*0.24,hw*0.2);
  if(P.lit){const wg=ctx.createRadialGradient(hxp+hw*0.18,hy-hh*0.62,0,hxp+hw*0.18,hy-hh*0.62,hw*0.7);wg.addColorStop(0,'rgba(255,210,122,0.35)');wg.addColorStop(1,'rgba(255,210,122,0)');ctx.fillStyle=wg;ctx.fillRect(hxp-hw,hy-hh*1.6,hw*2,hw*1.4);}
  if(P.smoke){for(let k=0;k<7;k++){const age=(t*0.35+k/7)%1;const cx=hxp+hw*0.24+age*age*(10+wind*6)*sc+Math.sin(age*6+k)*2*sc,cy=hy-hh-hw*0.4-age*44*sc;ctx.fillStyle=`rgba(236,236,240,${(1-age)*0.4})`;ctx.beginPath();circ(cx,cy,(2+age*7)*sc);ctx.fill();}}
  if(P.fog){const fg=ctx.createLinearGradient(0,g-hs*0.55,0,g);fg.addColorStop(0,rgba(hz,0));fg.addColorStop(1,rgba(hz,P.fog));ctx.fillStyle=fg;ctx.fillRect(0,g-hs*0.55,W,hs*0.55);}
  if(P.heat){ctx.strokeStyle='rgba(255,255,255,0.28)';ctx.lineWidth=Math.max(px,1);for(let j=0;j<7;j++){const y=g-hs*0.3+j*hs*0.05;ctx.beginPath();for(let x=0;x<=W;x+=6){const yy=y+Math.sin(x*0.05+t*3+j)*2.5*sc;x?ctx.lineTo(x,yy):ctx.moveTo(x,yy);}ctx.stroke();}}
  const L3=u=>g-hs*(0.012+0.02*(0.5+0.5*Math.sin(u*3.5+seed*3)));
  shape(L3);const gg=ctx.createLinearGradient(0,g-hs*0.04,0,H);gg.addColorStop(0,P.g0);gg.addColorStop(1,P.g1);ctx.fillStyle=gg;ctx.fill();
  if(H-g>20){const pxp=W*0.66,D=H-g;fx&&(fx._pl=pxp-D*0.45);ctx.fillStyle=rgba(P.path,0.7);ctx.beginPath();ctx.moveTo(pxp-D*0.45,H);ctx.bezierCurveTo(pxp-D*0.1,g+D*0.55,pxp+D*0.35,g+D*0.25,pxp-2*sc,L3(0.66)+1);ctx.lineTo(pxp+4*sc,L3(0.66)+1);ctx.bezierCurveTo(pxp+D*0.5,g+D*0.25,pxp+D*0.2,g+D*0.55,pxp+D*0.55,H);ctx.closePath();ctx.fill();}
  if(bigTree&&W>700){const bx=W*0.94,by=g+8*sc,th=170*sc;const lean=wind*0.3*sc+Math.sin(t*(0.9+wind*0.05))*(1+wind*0.22)*sc;
    ctx.fillStyle=cond==='night'?'#2a2224':'#6b4f3a';ctx.beginPath();ctx.moveTo(bx-8*sc,by);ctx.quadraticCurveTo(bx-3*sc,by-th*0.5,bx-3*sc+lean*0.4,by-th*0.9);ctx.lineTo(bx+3*sc+lean*0.4,by-th*0.9);ctx.quadraticCurveTo(bx+3*sc,by-th*0.5,bx+8*sc,by);ctx.closePath();ctx.fill();
    if(BARE){ctx.strokeStyle=cond==='night'||P.moon?'#2a2224':'#6b4f3a';ctx.lineCap='round';const br=(x,y,a,len,w,d)=>{if(d>4||len<6*sc)return;const x2=x+Math.cos(a)*len+lean*(1-d*0.15)*0.3,y2=y+Math.sin(a)*len;ctx.lineWidth=Math.max(px*0.8,w);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();const sw=Math.sin(t*1.2+d)*0.03*(1+wind*0.05);br(x2,y2,a-0.45+sw+rnd(d*7+len)*0.2,len*0.72,w*0.66,d+1);br(x2,y2,a+0.4+sw-rnd(d*3+len)*0.2,len*0.68,w*0.62,d+1);};br(bx+lean*0.4,by-th*0.9,-Math.PI/2,th*0.3,5*sc,0);}
    const blobs=BARE?[]:[[0,-0.72,0.36],[-0.34,-0.84,0.3],[0.34,-0.86,0.32],[0,-1.0,0.38],[-0.2,-1.16,0.27],[0.24,-1.13,0.25]];
    (FALL?[['#8e3a22',0],['#cf6a2c',-0.04],['#f2a444',-0.1]]:SEA==='spring'?[['#c9709a',0],['#ee9fc0',-0.04],['#fbd4e4',-0.1]]:[[P.dark,0],[mix(P.dark,P.land,0.55),-0.04],[P.snowy||SEA==='christmas'?'#f4f7fa':mix(P.land,'#ffffff',0.12),-0.1]]).forEach(([col,oy],li)=>{ctx.fillStyle=col;ctx.beginPath();blobs.forEach(([bxo,byo,r],bi)=>{if(li===2&&bi%2)return;const f=-byo;circ(bx+bxo*th+lean*f*(1.2+bi*0.1)-li*4*sc,by+(byo+oy)*th,r*th*(li===2?0.55:li===1?0.8:1));});ctx.fill();});}
  const cols=P.blades,paths=cols.map(()=>new Path2D()),gs=0.9+wind*0.12;
  const blade=(x,y,h,ci)=>{const gust=Math.sin(x*0.012-t*gs)*0.5+0.5;const bend=Math.min(1.1,wind*0.02+gust*(0.04+wind*0.022)+Math.sin(t*2.3+x*0.3)*0.04);const tx=x+bend*h,ty=y-h*(1-bend*0.3);paths[ci].moveTo(x,y);paths[ci].quadraticCurveTo(x+bend*h*0.2,y-h*0.6,tx,ty);return [tx,ty];};
  const n1=P.sparse?W/10:W/2.6;for(let i=0;i<n1;i++){const x=rnd(i*3+1)*W;blade(x,L3(x/W)+2+rnd(i*5)*5*sc,(5+rnd(i*7)*8)*sc+2,i%cols.length);}
  const n2=P.sparse?W/7:W/1.4,D=Math.max(1,H-g);const tips=[];
  for(let i=0;i<n2;i++){const x=rnd(i*13+7)*W,d=rnd(i*17+3);const tip=blade(x,g+d*D,(7+d*22+rnd(i*19)*8)*sc+2,(i+1)%cols.length);if(P.flowers&&i%9===0)tips.push([tip,d,i]);}
  ctx.lineCap='round';cols.forEach((c,i)=>{ctx.strokeStyle=c;ctx.lineWidth=Math.max(px*0.9,1.4*sc);ctx.stroke(paths[i]);});
  const FC=['#f6e27a','#fbf6ec','#e79bb0'];tips.forEach(([[x,y],d,i])=>{ctx.fillStyle=FC[i%3];ctx.beginPath();circ(x,y,Math.max(px*0.6,(1.2+d*2)*sc+0.6));ctx.fill();});
  if(fx&&fx.act==='picnic'){const ax=+fx.ax,ay=+fx.ay,k=(+fx.sc||4)/4;const tw=120*k,bw=180*k,bh=30*k,y0=ay-4*k;const rows=4,cl=8;
    for(let r=0;r<rows;r++)for(let c=0;c<cl;c++){const f0=r/rows,f1=(r+1)/rows,w0=tw+(bw-tw)*f0,w1=tw+(bw-tw)*f1;ctx.fillStyle=(r+c)%2?'#f5ecdc':'#d65a4a';ctx.beginPath();ctx.moveTo(ax-w0/2+w0*c/cl,y0+bh*f0);ctx.lineTo(ax-w0/2+w0*(c+1)/cl,y0+bh*f0);ctx.lineTo(ax-w1/2+w1*(c+1)/cl,y0+bh*f1);ctx.lineTo(ax-w1/2+w1*c/cl,y0+bh*f1);ctx.closePath();ctx.fill();}
    const bx=ax+bw*0.42,by=ay+6*k;ctx.strokeStyle='#7a5028';ctx.lineWidth=Math.max(px,3*k);ctx.beginPath();ctx.arc(bx,by-20*k,12*k,Math.PI,0);ctx.stroke();
    ctx.fillStyle='#a8743f';ctx.beginPath();ctx.roundRect(bx-17*k,by-20*k,34*k,21*k,4*k);ctx.fill();ctx.fillStyle='#8a5c30';for(let j=1;j<4;j++)ctx.fillRect(bx-17*k,by-20*k+j*5*k,34*k,Math.max(px*0.8,1.2*k));
    ctx.fillStyle='#d65a4a';ctx.fillRect(bx-15*k,by-24*k,18*k,5*k);
    ctx.fillStyle='#d9483b';ctx.beginPath();circ(ax-bw*0.32,ay+10*k,5*k);ctx.fill();ctx.fillStyle='#5d9c44';ctx.fillRect(ax-bw*0.32,ay+3*k,2*k,3*k);
    ctx.fillStyle='#f3e3a8';ctx.fillRect(ax-bw*0.2,ay+14*k,14*k,8*k);ctx.fillStyle='#e8a15c';ctx.fillRect(ax-bw*0.2,ay+17*k,14*k,2*k);}
  if(SEA){const rs=Math.max(0.6,sc),heart=(x,y,r,c)=>{ctx.fillStyle=c;ctx.beginPath();circ(x-r*0.5,y,r*0.55);circ(x+r*0.5,y,r*0.55);ctx.fill();ctx.beginPath();ctx.moveTo(x-r*1.02,y+r*0.15);ctx.lineTo(x,y+r*1.25);ctx.lineTo(x+r*1.02,y+r*0.15);ctx.closePath();ctx.fill();};
    if(FALL){for(let i=0;i<Math.max(40,W/14);i++){const x=rnd(i*31+5)*W,y=g+rnd(i*17+2)*(H-g)*0.9+2;ctx.fillStyle=['#d9772e','#b8452e','#e8b33c','#9a3f24'][i%4];ctx.beginPath();ctx.ellipse(x,y,Math.max(px,3*rs),Math.max(px*0.6,1.6*rs),rnd(i)*3,0,Math.PI*2);ctx.fill();}
      for(let i=0;i<Math.max(26,W/30);i++){const sp=(18+rnd(i*3)*22)*rs,fall=(rnd(i*7)*(H+80)+t*sp)%(H+80)-40,x=((rnd(i*11+3)*W+t*(8+wind*3)*rs+Math.sin(t*1.6+i)*18*rs)%W+W)%W;ctx.save();ctx.translate(x,fall);ctx.rotate(t*2.5+i);ctx.fillStyle=['#e07a2e','#c44a2c','#f0b53c','#a8452a'][i%4];ctx.beginPath();ctx.ellipse(0,0,Math.max(px,4*rs),Math.max(px*0.6,2*rs),0,0,Math.PI*2);ctx.fill();ctx.restore();}}
    if(SEA==='halloween'){[[0.24,0],[0.78,1],[0.86,2]].forEach(([u,i])=>{const x=u*W,y=L3(u)+8*rs,r=10*rs*(i===1?1.2:1);ctx.fillStyle='#e0782a';ctx.beginPath();ctx.ellipse(x,y-r*0.7,r*1.25,r*0.9,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b95a1c';ctx.fillRect(x-px*0.6,y-r*1.6,Math.max(px,2*rs),r*0.9);ctx.fillRect(x-r*0.4,y-r*1.5,Math.max(px,1.4*rs),r*1.5);ctx.fillRect(x+r*0.35,y-r*1.5,Math.max(px,1.4*rs),r*1.5);ctx.fillStyle='#4a6a2a';ctx.fillRect(x-1*rs,y-r*1.8,Math.max(px,2.4*rs),r*0.4);
        const gl=0.7+0.3*Math.sin(t*9+i*2);ctx.fillStyle='rgba(255,214,90,'+gl+')';ctx.beginPath();ctx.moveTo(x-r*0.65,y-r*0.95);ctx.lineTo(x-r*0.3,y-r*0.95);ctx.lineTo(x-r*0.48,y-r*1.25);ctx.closePath();ctx.moveTo(x+r*0.65,y-r*0.95);ctx.lineTo(x+r*0.3,y-r*0.95);ctx.lineTo(x+r*0.48,y-r*1.25);ctx.closePath();ctx.fill();ctx.fillRect(x-r*0.55,y-r*0.55,r*1.1,Math.max(px,r*0.22));});
      for(let i=0;i<6;i++){const sp=(40+rnd(i)*30)*rs,x=((rnd(i*5)*W+t*sp)%(W+80))-40,y=g*(0.12+rnd(i*9)*0.35)+Math.sin(t*3+i)*10*rs,fl=Math.sin(t*14+i)*5*rs;ctx.fillStyle=cond==='night'?'#0b0812':'#231a2a';ctx.beginPath();ctx.moveTo(x-10*rs,y-fl);ctx.lineTo(x-4*rs,y+1*rs);ctx.lineTo(x,y-2*rs);ctx.lineTo(x+4*rs,y+1*rs);ctx.lineTo(x+10*rs,y-fl);ctx.lineTo(x+3*rs,y+4*rs);ctx.lineTo(x,y+2*rs);ctx.lineTo(x-3*rs,y+4*rs);ctx.closePath();ctx.fill();}}
    if(SEA==='christmas'){const cols=['#e8504a','#f2c230','#5fb36a','#4f9be0'];for(let row=0;row<2;row++){const y0=g-hs*(0.1+row*0.07);ctx.strokeStyle='rgba(40,30,30,0.5)';ctx.lineWidth=Math.max(px*0.5,1);const seg=W/5;for(let k=0;k<5;k++){const a=k*seg,b=a+seg;ctx.beginPath();ctx.moveTo(a,y0);ctx.quadraticCurveTo(a+seg/2,y0+16*rs,b,y0);ctx.stroke();for(let q=1;q<8;q++){const f=q/8,x=a+seg*f,y=y0+2*(1-f)*f*16*rs+2*rs,on=Math.sin(t*3+q*1.7+k+row)>-0.2;ctx.fillStyle=on?cols[(q+k+row)%4]:'rgba(60,50,50,0.6)';ctx.beginPath();circ(x,y,Math.max(px*0.8,2.2*rs));ctx.fill();if(on){ctx.fillStyle='rgba(255,240,200,0.25)';ctx.beginPath();circ(x,y,Math.max(px*1.6,5*rs));ctx.fill();}}}}
      {const x=W*0.72,y=L3(0.72)+4*rs,h=64*rs;ctx.fillStyle='#6b4a30';ctx.fillRect(x-3*rs,y-8*rs,6*rs,10*rs);ctx.fillStyle='#2f6a3e';for(let k=0;k<3;k++){const yy=y-8*rs-k*h*0.28,ww=h*(0.42-k*0.1);ctx.beginPath();ctx.moveTo(x-ww,yy);ctx.lineTo(x,yy-h*0.42);ctx.lineTo(x+ww,yy);ctx.closePath();ctx.fill();}for(let q=0;q<12;q++){const on=Math.sin(t*4+q*2.1)>-0.3;ctx.fillStyle=on?cols[q%4]:'#39463a';ctx.beginPath();circ(x+(rnd(q*3)-0.5)*h*0.6*(1-q/14),y-10*rs-q*h*0.065,Math.max(px*0.7,2*rs));ctx.fill();}ctx.fillStyle='#f6d34a';ctx.beginPath();for(let q=0;q<10;q++){const a=q*Math.PI/5-Math.PI/2,r=q%2?3*rs:7*rs;ctx.lineTo(x+Math.cos(a)*r,y-8*rs-h*0.98+Math.sin(a)*r);}ctx.closePath();ctx.fill();}
      if(!P.rain&&!P.snow){ctx.fillStyle='rgba(255,255,255,0.85)';ctx.beginPath();for(let i=0;i<W*H/5000;i++){const y=(rnd(i*5+4)*(H+10)+t*(20+rnd(i*3)*20))%(H+10)-5,x=(((rnd(i*7+8)*W+Math.sin(t*0.9+i)*8)%W)+W)%W;circ(x,y,Math.max(px*0.6,1.4));}ctx.fill();}}
    if(SEA==='spring'){for(let i=0;i<Math.max(40,W/14);i++){const sp=(14+rnd(i*3)*18)*rs,fall=(rnd(i*7)*(H+60)+t*sp)%(H+60)-30,x=((rnd(i*11+3)*W+t*(10+wind*3)*rs+Math.sin(t*1.8+i)*14*rs)%W+W)%W;ctx.save();ctx.translate(x,fall);ctx.rotate(t*2+i);ctx.fillStyle=i%3?'#f6b9d0':'#fbe0ea';ctx.beginPath();ctx.ellipse(0,0,Math.max(px,2.8*rs),Math.max(px*0.6,1.6*rs),0,0,Math.PI*2);ctx.fill();ctx.restore();}
      for(let i=0;i<Math.max(30,W/20);i++){const x=rnd(i*23+9)*W,y=g+rnd(i*29)*(H-g)*0.9+3;ctx.fillStyle=['#f6b9d0','#fbf1dc','#f2d36a','#e58fb0'][i%4];ctx.beginPath();circ(x,y,Math.max(px*0.8,2.4*rs));ctx.fill();}}
    const fw=(n,night)=>{const cols=['#ff6a5a','#ffd24a','#7fd6ff','#b98cff','#8dff9a','#ffffff'];for(let k=0;k<n;k++){const per=2.4+rnd(k*3)*1.2,ph=((t+k*0.83)/per)%1,cyc=Math.floor((t+k*0.83)/per);const cx=W*(0.12+rnd(cyc*7+k)*0.76),cy=g*(0.12+rnd(cyc*5+k*2)*0.32),col=cols[(cyc+k)%cols.length];
      if(ph<0.22){const q=ph/0.22;ctx.fillStyle='rgba(255,240,200,0.9)';ctx.fillRect(cx-1,g-(g-cy)*q,Math.max(px,2),Math.max(px*2,6));continue;}
      const q=(ph-0.22)/0.78,R=(38+rnd(cyc)*30)*rs*(1-Math.pow(1-q,3)),a=Math.max(0,1-q*1.1)*(night?1:0.75);ctx.fillStyle=col;ctx.globalAlpha=a;for(let j=0;j<22;j++){const an=j/22*Math.PI*2+cyc;const x=cx+Math.cos(an)*R,y=cy+Math.sin(an)*R+q*q*18*rs;ctx.fillRect(x-px,y-px,Math.max(px*1.6,3),Math.max(px*1.6,3));}ctx.globalAlpha=1;}};
    if(SEA==='fourth'||SEA==='newyear')fw(cond==='night'||P.moon||P.stars?5:3,cond==='night'||P.moon);
    if(SEA==='newyear'){for(let i=0;i<Math.max(40,W/12);i++){const sp=(30+rnd(i*3)*30)*rs,y=(rnd(i*7)*(H+40)+t*sp)%(H+40)-20,x=((rnd(i*11)*W+Math.sin(t*2+i)*16*rs)%W+W)%W;ctx.save();ctx.translate(x,y);ctx.rotate(t*3+i);ctx.fillStyle=['#ffd24a','#ff6a5a','#7fd6ff','#b98cff','#fbf6ec'][i%5];ctx.fillRect(-2*rs,-1*rs,Math.max(px,4*rs),Math.max(px*0.7,2*rs));ctx.restore();}}
    if(SEA==='fourth'){[0.18,0.42,0.78].forEach((u,k)=>{const x=u*W,y=L3(u)+2;ctx.fillStyle='#6b5a4a';ctx.fillRect(x,y-40*rs,Math.max(px,2*rs),40*rs);const wv=Math.sin(t*3+k)*2*rs;for(let r=0;r<5;r++){ctx.fillStyle=r%2?'#fbf6ec':'#d0584a';ctx.fillRect(x+2*rs,y-40*rs+r*2.4*rs+wv*(r/5),16*rs,2.4*rs);}ctx.fillStyle='#3a5a9a';ctx.fillRect(x+2*rs,y-40*rs,7*rs,7*rs);});}
    if(SEA==='lunar'){for(let i=0;i<Math.max(8,W/90);i++){const sp=(8+rnd(i*3)*8)*rs,y=H-((rnd(i*7)*(H+120)+t*sp)%(H+120))+60,x=((rnd(i*11+1)*W+Math.sin(t*0.7+i)*14*rs)%W+W)%W,r=(7+rnd(i*5)*5)*rs,fl=0.8+0.2*Math.sin(t*7+i);const gl=ctx.createRadialGradient(x,y,0,x,y,r*3.2);gl.addColorStop(0,'rgba(255,170,90,'+(0.45*fl)+')');gl.addColorStop(1,'rgba(255,170,90,0)');ctx.fillStyle=gl;ctx.fillRect(x-r*3.2,y-r*3.2,r*6.4,r*6.4);ctx.fillStyle='#d8392f';ctx.beginPath();ctx.ellipse(x,y,r,r*1.15,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f2c230';ctx.fillRect(x-r*0.6,y-r*1.25,r*1.2,Math.max(px,r*0.22));ctx.fillRect(x-r*0.6,y+r*1.05,r*1.2,Math.max(px,r*0.22));ctx.fillStyle='rgba(255,220,140,'+(0.5*fl)+')';ctx.fillRect(x-r*0.25,y-r*0.6,r*0.5,r*1.2);}}
    if(SEA==='stpatricks'){const rx=W*0.62,ry=g*1.02,R0=Math.min(W*0.42,g*0.95);['#e8504a','#f29a3a','#f2d24a','#6cc46a','#4f9be0','#7a6ad0'].forEach((c,k)=>{ctx.strokeStyle=c;ctx.globalAlpha=0.4;ctx.lineWidth=Math.max(px*2,6*rs);ctx.beginPath();ctx.arc(rx,ry,R0-k*6*rs,Math.PI*1.05,Math.PI*1.95);ctx.stroke();});ctx.globalAlpha=1;}
    if(SEA==='stpatricks'){for(let i=0;i<Math.max(26,W/26);i++){const x=rnd(i*31+2)*W,y=g+rnd(i*17+5)*(H-g)*0.9+4,r=(3.6+rnd(i)*2.4)*rs;ctx.fillStyle=i%7===0?'#2f8a3e':'#3fa24e';ctx.beginPath();circ(x-r*0.8,y,r);circ(x+r*0.8,y,r);circ(x,y-r*1.1,r);if(i%7===0)circ(x,y+r*1.1,r);ctx.fill();ctx.fillRect(x-0.5,y,Math.max(px*0.6,1),r*2);}}
    const bunt=(cols,kind,y0)=>{const n=Math.max(10,Math.round(W/46)),sag=22*rs;ctx.strokeStyle='rgba(60,40,30,0.6)';ctx.lineWidth=Math.max(px*0.5,1);ctx.beginPath();for(let x=0;x<=W;x+=6){const f=x/W,yy=y0+Math.sin(f*Math.PI)*sag;x?ctx.lineTo(x,yy):ctx.moveTo(x,yy);}ctx.stroke();
      for(let k=0;k<n;k++){const f=(k+0.5)/n,x=f*W,yy=y0+Math.sin(f*Math.PI)*sag,sw=Math.sin(t*2+k)*(1+wind*0.15)*rs,w=14*rs,h=kind==='flag'?16*rs:18*rs;ctx.fillStyle=cols[k%cols.length];ctx.beginPath();
        if(kind==='flag'){ctx.moveTo(x-w/2,yy);ctx.lineTo(x+w/2,yy);ctx.lineTo(x+sw,yy+h);}else if(kind==='diamond'){ctx.moveTo(x,yy);ctx.lineTo(x+w/2,yy+h/2);ctx.lineTo(x+sw*0.5,yy+h);ctx.lineTo(x-w/2,yy+h/2);}else{ctx.moveTo(x-w/2,yy);ctx.lineTo(x+w/2,yy);ctx.lineTo(x+w/2+sw,yy+h);for(let z=4;z>=0;z--)ctx.lineTo(x-w/2+sw+w*z/4,yy+h+(z%2?3*rs:0));ctx.lineTo(x-w/2+sw,yy+h);}
        ctx.closePath();ctx.fill();if(kind==='papel'){ctx.fillStyle='rgba(255,255,255,0.45)';ctx.fillRect(x-2*rs+sw*0.5,yy+5*rs,4*rs,4*rs);ctx.fillRect(x-5*rs+sw*0.5,yy+11*rs,2*rs,2*rs);ctx.fillRect(x+3*rs+sw*0.5,yy+11*rs,2*rs,2*rs);}}};
    const BY=Math.max(10,g*0.06);
    if(SEA==='pride')bunt(['#e8504a','#f29a3a','#f2d24a','#4fb36a','#4f7fd0','#8a5ac0'],'flag',BY);
    if(SEA==='easter'){const EC=['#f6b9d0','#aee0f4','#f4e4a6','#cfe6b0','#d9c4f2'];for(let i=0;i<Math.max(12,W/60);i++){const x=rnd(i*37+3)*W,y=g+10+rnd(i*41+9)*(H-g-16),r=(4+rnd(i*5)*2)*rs;ctx.fillStyle=EC[i%5];ctx.beginPath();ctx.ellipse(x,y,r*0.75,r,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=EC[(i+2)%5];ctx.fillRect(x-r*0.7,y-r*0.15,r*1.4,Math.max(px,r*0.3));}}
    if(SEA==='perseids'&&(P.stars||cond==='night')){for(let k=0;k<9;k++){const per=1.6+k*0.37,ph=((t+k*0.61)/per)%1,cyc=Math.floor((t+k*0.61)/per);if(ph>0.3)continue;const p=ph/0.3,x0=W*(0.1+rnd(cyc*5+k)*0.8),y0=g*(0.05+rnd(cyc*3+k)*0.3),L=Math.max(70,W*0.1);const x=x0+p*L,y=y0+p*L*0.45;const gr=ctx.createLinearGradient(x-L*0.5,y-L*0.22,x,y);gr.addColorStop(0,'rgba(255,247,218,0)');gr.addColorStop(1,'rgba(255,247,218,'+(1-p)+')');ctx.strokeStyle=gr;ctx.lineWidth=Math.max(px,1.6);ctx.beginPath();ctx.moveTo(x-L*0.5,y-L*0.22);ctx.lineTo(x,y);ctx.stroke();}}
    if(SEA==='harvest'){[0.12,0.27,0.58,0.74].forEach((u,k)=>{const x=u*W,y=L3(u)+7*rs,r=(13+rnd(k)*4)*rs;ctx.fillStyle='#d9b45a';ctx.beginPath();ctx.ellipse(x,y-r*0.8,r*1.2,r*0.85,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#b08a3a';ctx.lineWidth=Math.max(px*0.6,1.2*rs);ctx.beginPath();ctx.ellipse(x,y-r*0.8,r*0.7,r*0.5,0,0,Math.PI*2);ctx.stroke();});if(P.moon){const gl=ctx.createRadialGradient(sx,sy,0,sx,sy,sr*4);gl.addColorStop(0,'rgba(255,170,80,0.45)');gl.addColorStop(1,'rgba(255,170,80,0)');ctx.fillStyle=gl;ctx.fillRect(sx-sr*4,sy-sr*4,sr*8,sr*8);}}
    if(SEA==='thanks'){[0.15,0.19,0.235].forEach((u,k)=>{const x=u*W,y=L3(u)+7*rs,r=(9+k*2)*rs;ctx.fillStyle=k===1?'#e8a13c':'#d9772e';ctx.beginPath();ctx.ellipse(x,y-r,r*1.3,r,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#4a6a2a';ctx.fillRect(x-1*rs,y-r*2.1,Math.max(px,2*rs),r*0.4);});const tx=W*(0.38+Math.sin(t*0.3)*0.08),ty=L3(0.38)+8*rs,dirn=Math.cos(t*0.3)>0?1:-1,r=10*rs;['#b8452e','#e8a13c','#6b4424','#d9772e','#8a3a22'].forEach((c,k)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(tx-dirn*r*0.6+(k-2)*2.2*rs,ty-r*1.8,r*0.45,r*1.3,(k-2)*0.35,0,Math.PI*2);ctx.fill();});ctx.fillStyle='#6b4424';ctx.beginPath();ctx.ellipse(tx,ty-r,r*1.1,r*0.9,0,0,Math.PI*2);circ(tx+dirn*r*1.1,ty-r*1.9,r*0.45);ctx.fill();ctx.fillStyle='#d0584a';ctx.fillRect(tx+dirn*r*1.3,ty-r*1.8,Math.max(px,1.6*rs),r*0.6);ctx.fillStyle='#f2c230';ctx.fillRect(tx+dirn*r*1.5,ty-r*2,Math.max(px,1.6*rs),Math.max(px,1.2*rs));}
    if(SEA==='hanukkah'){const x=W*0.905-44*rs,y=L2(0.86)+2,sp=5*rs;ctx.fillStyle='#c9a24a';ctx.fillRect(x-sp*4.5,y-3*rs,sp*9,Math.max(px,2*rs));ctx.fillRect(x-1*rs,y-18*rs,Math.max(px,2*rs),18*rs);ctx.fillRect(x-4*rs,y-2*rs,8*rs,2*rs);for(let k=-4;k<=4;k++){const hx=x+k*sp,hy=y-(k===0?20:14)*rs;ctx.fillStyle='#c9a24a';ctx.fillRect(hx-0.5*rs,hy,Math.max(px,1.4*rs),(k===0?2:5)*rs+(k?0:0));ctx.fillStyle='#bcd8f4';ctx.fillRect(hx-1*rs,hy-5*rs,2*rs,5*rs);const f=0.8+0.2*Math.sin(t*12+k*2);ctx.fillStyle='rgba(255,200,90,'+f+')';ctx.beginPath();ctx.ellipse(hx,hy-7*rs,1.4*rs,2.4*rs*f,0,0,Math.PI*2);ctx.fill();const gl=ctx.createRadialGradient(hx,hy-7*rs,0,hx,hy-7*rs,8*rs);gl.addColorStop(0,'rgba(255,210,122,0.35)');gl.addColorStop(1,'rgba(255,210,122,0)');ctx.fillStyle=gl;ctx.fillRect(hx-8*rs,hy-15*rs,16*rs,16*rs);}}
    if(SEA==='earthday'){[0.1,0.24,0.4,0.62,0.78,0.9].forEach((u,k)=>{const x=u*W,y=L3(u)+4*rs,h=(26+rnd(k*5)*12)*rs,sw=Math.sin(t*1.4+k)*(1+wind*0.2)*rs;ctx.fillStyle='#6b4a30';ctx.beginPath();ctx.ellipse(x,y,9*rs,3*rs,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#4f8a34';ctx.lineWidth=Math.max(px,3*rs);ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+sw*0.3,y-h*0.5,x+sw,y-h);ctx.stroke();ctx.fillStyle='#5fbf45';[[-1,0.55],[1,0.72],[-1,0.9],[1,1]].forEach(([d,f])=>{ctx.beginPath();ctx.ellipse(x+sw*f+d*6*rs,y-h*f,7*rs,3.2*rs,d*0.5,0,Math.PI*2);ctx.fill();});});}
    if(SEA==='valentine'){for(let i=0;i<Math.max(14,W/60);i++){const sp=(16+rnd(i*3)*18)*rs,up=H-((rnd(i*7)*(H+80)+t*sp)%(H+80))+40,x=((rnd(i*11+1)*W+Math.sin(t*1.2+i)*20*rs)%W+W)%W,r=(8+rnd(i*5)*8)*rs;ctx.globalAlpha=Math.min(1,Math.max(0,(H-up)/H+0.3));heart(x,up,r,['#e8506a','#f28aa0','#d93a5a','#fbb6c6'][i%4]);}ctx.globalAlpha=1;}}
  if(CLIM==='autumn'&&!P.snowy){const rs=Math.max(0.6,sc),LC=['#d9772e','#b8452e','#e8b33c','#9a3f24','#c9602a'];for(let i=0;i<Math.max(70,W/7);i++){const d=rnd(i*17+11),x=rnd(i*31+7)*W,y=L3(x/W)+2+d*(H-g)*0.95,r=(2+d*3.2)*rs,jig=wind>10?Math.sin(t*3+i)*0.15:0;ctx.fillStyle=LC[i%5];ctx.beginPath();ctx.ellipse(x,y,Math.max(px,r*1.5),Math.max(px*0.6,r*0.7),rnd(i*3)*3+jig,0,Math.PI*2);ctx.fill();}}
  {const rs=Math.max(0.6,sc),dayFair=!P.moon&&!P.stars&&cond!=='night'&&!P.ceil&&wind<30,calm=!P.rain&&!P.snow;
    if(!P.moon&&cond!=='night'&&wind<32&&!(fx&&fx.storm==='storm')){const per=45,ph=(t/per)%1,cyc=Math.floor(t/per);if(ph<0.55){const ph0=ph;}const dirn=rnd(cyc)>0.5?1:-1;const bx=dirn>0?-80+ph*(W+160):W+80-ph*(W+160),by=g*(0.18+rnd(cyc*3)*0.3)+Math.sin(ph*6)*8*rs;ctx.strokeStyle=P.ceil?'#2d3140':'#3a3346';ctx.lineWidth=Math.max(px*0.8,1.6*rs);ctx.beginPath();for(let b=0;b<7;b++){const k=b===0?0:Math.ceil(b/2),side=b%2?1:-1,x=bx-dirn*k*12*rs,y=by+(b?side*k*6*rs:0),fl=Math.sin(t*9+b)*2.6*rs,w=5*rs;ctx.moveTo(x-w,y-fl);ctx.lineTo(x,y);ctx.lineTo(x+w,y-fl);}ctx.stroke();}
    if(dayFair&&calm){for(let i=0;i<2;i++){const sp=(14+rnd(i*5)*10)*rs,x=((rnd(i*7+2)*W+t*sp*(i%2?1:-1)+Math.sin(t*0.8+i)*30*rs)%W+W)%W,y=g+(-10+rnd(i*9)*(H-g)*0.5)*1+Math.sin(t*2.2+i*3)*10*rs,f=Math.abs(Math.sin(t*12+i));ctx.fillStyle=['#f2a444','#fbf6ec','#8fb8e8','#e79bb0'][i%4];ctx.beginPath();ctx.ellipse(x-2.6*rs*f,y,2.8*rs*f+0.6,2.2*rs,0,0,Math.PI*2);ctx.ellipse(x+2.6*rs*f,y,2.8*rs*f+0.6,2.2*rs,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2b2340';ctx.fillRect(x-0.5,y-2*rs,Math.max(px*0.5,1),4*rs);}}
    if(dayFair&&calm&&wind>=6){ctx.fillStyle='rgba(255,255,255,0.85)';for(let i=0;i<Math.max(4,W/220);i++){const sp=(20+wind*3)*(0.6+rnd(i)*0.8)*rs,x=((rnd(i*13+5)*W+t*sp)%(W+40))-20,y=g*(0.55+rnd(i*3)*0.5)+Math.sin(t*1.6+i*2)*12*rs;ctx.fillRect(x,y,Math.max(px*0.8,1.6),Math.max(px*0.8,1.6));ctx.fillRect(x-2*rs,y-1*rs,Math.max(px*0.5,1),Math.max(px*0.5,1));ctx.fillRect(x+2*rs,y-1*rs,Math.max(px*0.5,1),Math.max(px*0.5,1));}}
    if(dayFair&&calm&&wind<12){const per=180,ph=(t%per)/per;if(ph<0.3){const ph2=ph/0.3*0.55;const q=ph2/0.55,x=W*(1.1-q*1.25),y=g*(0.2+Math.sin(q*3)*0.05),r=13*rs;ctx.fillStyle='#d65a4a';ctx.beginPath();ctx.ellipse(x,y,r,r*1.15,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f2c230';ctx.beginPath();ctx.ellipse(x,y,r*0.45,r*1.15,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#5e3c20';ctx.lineWidth=Math.max(px*0.5,1);ctx.beginPath();ctx.moveTo(x-r*0.7,y+r*0.9);ctx.lineTo(x-r*0.35,y+r*1.8);ctx.moveTo(x+r*0.7,y+r*0.9);ctx.lineTo(x+r*0.35,y+r*1.8);ctx.stroke();ctx.fillStyle='#8a5c30';ctx.fillRect(x-r*0.4,y+r*1.8,r*0.8,r*0.55);}}
    const SNOWD=(P.snow||(fx&&fx.precip==='snow'))&&!(fx&&(fx.precip==='sleet'||fx.precip==='none'))&&(fx&&fx.int!==''&&fx.int!=null?+fx.int:0.5)>=0.35;
    if(SNOWD&&fx&&fx.ax){const ax=+fx.ax,ay=+fx.ay,k=(+fx.sc||4)/4;ctx.fillStyle='rgba(150,170,200,0.55)';for(let q=1;q<14;q++){const x=ax-q*14*k-10*k,y=ay+6*k+Math.sin(q*0.7)*3*k+(q%2?4*k:-1*k);if(x<0)break;ctx.beginPath();ctx.ellipse(x,y,4*k,2*k,0,0,Math.PI*2);ctx.fill();}}
  }
  if(P.leaves&&wind>=9){for(let i=0;i<12;i++){const sp=(40+wind*7)*(0.7+rnd(i)*0.6)*Math.max(0.5,sc);const span=W+60;const x=((rnd(i*7+seed)*span+t*sp)%span)-30;const y=g*0.45+rnd(i*3)*(g*0.55)+Math.sin(t*2.2+i)*14*sc;ctx.save();ctx.translate(x,y);ctx.rotate(t*4+i);ctx.fillStyle=i%2?'#c9a44f':'#86b35a';ctx.beginPath();ctx.ellipse(0,0,Math.max(px,3.2*sc+1),Math.max(px*0.6,1.4*sc+0.6),0,0,Math.PI*2);ctx.fill();ctx.restore();}}
  if(wind>=7&&!P.rain){ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(1.3,px);for(let i=0;i<Math.max(3,W/180);i++){const sp=(150+wind*10)*Math.max(0.5,sc);const span=W*1.6;const x=((rnd(i*11+seed)*span+t*sp)%span)-W*0.3;const y=g*(0.2+rnd(i*5+1)*0.6);const L=(50+rnd(i)*60)*sc;ctx.globalAlpha=Math.max(0,Math.sin(Math.min(1,Math.max(0,x/W))*Math.PI))*0.45;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+L*0.5,y-5*sc,x+L,y-1);ctx.stroke();}ctx.globalAlpha=1;}
  const PR=fx&&fx.precip,FK=fx&&fx.storm,INT=fx&&fx.int!==undefined&&fx.int!==''?+fx.int:0.5,DG=H-g;
    const WET=PR!=='none'&&(P.rain||PR==='rain'||PR==='drizzle'||PR==='sleet'),SNW=PR!=='none'&&PR!=='sleet'&&(P.snow||PR==='snow');
  if(WET&&DG>10){const pc=mix(P.sky[1],'#dfe8f2',0.25),pd=mix(P.sky[0],'#20283a',0.2),np=Math.round(W/80*(0.25+INT*1.9));
    for(let i=0;i<np;i++){const x=rnd(i*37+seed+1)*W,y=g+5+rnd(i*41+2)*(DG-8),rw=(8+rnd(i*43)*22)*(0.35+INT*1.3)*Math.max(0.6,sc),rh=rw*0.24;ctx.fillStyle=pd;ctx.beginPath();ctx.ellipse(x,y+1,rw,rh,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=pc;ctx.beginPath();ctx.ellipse(x,y,rw*0.94,rh*0.82,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,255,0.45)';ctx.fillRect(x-rw*0.5,y-rh*0.3,rw*0.35,Math.max(px*0.6,1));
      const ph=(t*1.3+rnd(i*5))%1;ctx.strokeStyle='rgba(255,255,255,'+(0.6*(1-ph))+')';ctx.lineWidth=Math.max(px*0.6,1);ctx.beginPath();ctx.ellipse(x+rw*0.2,y,rw*0.5*ph+1,rh*0.5*ph+0.5,0,0,Math.PI*2);ctx.stroke();}
    if(INT>0.6){const lv=(INT-0.6)/0.4;const sg=ctx.createLinearGradient(0,g,0,H);sg.addColorStop(0,'rgba(24,30,26,'+(0.12+lv*0.2)+')');sg.addColorStop(1,'rgba(20,26,24,'+(0.2+lv*0.28)+')');ctx.fillStyle=sg;ctx.fillRect(0,g-2,W,DG+2);
      ctx.fillStyle='rgba(210,225,240,'+(0.12+lv*0.18)+')';for(let i=0;i<W/10*(0.5+lv);i++){const x=rnd(i*61+seed)*W,y=g+3+rnd(i*67)*(DG-4),w=(4+rnd(i*71)*16)*Math.max(0.6,sc);ctx.fillRect(x,y,w,Math.max(px*0.6,1));}
      ctx.fillStyle='rgba(48,62,78,'+(0.35+lv*0.25)+')';for(let i=0;i<Math.round(W/60*(0.5+lv*1.5));i++){const x=rnd(i*83+seed)*W,y=g+4+rnd(i*89)*(DG-6),rw=(6+rnd(i*97)*14)*Math.max(0.6,sc);ctx.beginPath();ctx.ellipse(x,y,rw,rw*0.18,0,0,Math.PI*2);ctx.fill();}}}
  if(SNW&&DG>6){const a=Math.min(1,INT*1.15);
    if(INT<0.35){ctx.fillStyle='rgba(248,250,253,0.92)';const n=Math.round(W/10*(0.4+INT*3));for(let i=0;i<n;i++){const x=rnd(i*29+seed)*W,y=g+rnd(i*31)*DG,r=(3+rnd(i*7)*9)*Math.max(0.6,sc)*(0.5+INT*2);ctx.beginPath();ctx.ellipse(x,y,r,r*0.35,0,0,Math.PI*2);ctx.fill();}}
    else{const top=g-2-a*9*sc;ctx.fillStyle='rgba(246,249,253,0.97)';ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W+6;x+=6)ctx.lineTo(x,top+Math.sin(x*0.02+seed)*3*sc*a+Math.sin(x*0.07)*1.5*sc);ctx.lineTo(W+6,H);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(180,198,222,0.5)';for(let i=0;i<W/60;i++){const x=rnd(i*19+seed)*W,y=g+rnd(i*23)*DG;ctx.beginPath();ctx.ellipse(x,y,(14+rnd(i)*20)*sc,2*sc+0.5,0,0,Math.PI*2);ctx.fill();}
      if(INT>0.65){const d=(INT-0.65)/0.35;ctx.fillStyle='#ffffff';for(let i=0;i<6;i++){const x=rnd(i*53+seed)*W,r=(40+rnd(i*5)*60)*sc*(0.5+d);ctx.beginPath();ctx.ellipse(x,H+r*0.2-d*DG*0.25,r,r*0.45,0,Math.PI,Math.PI*2);ctx.fill();}ctx.fillStyle='rgba(170,190,215,0.45)';for(let i=0;i<6;i++){const x=rnd(i*53+seed)*W,r=(40+rnd(i*5)*60)*sc*(0.5+d);ctx.fillRect(x-r*0.6,H-d*DG*0.25+r*0.15,r*1.2,Math.max(px*0.6,1.5));}}}}
  if(P.rain||PR==='rain'||PR==='drizzle'||PR==='sleet'||PR==='hail'){ctx.strokeStyle='rgba(215,228,245,0.55)';ctx.lineWidth=Math.max(1,px*0.8);const n=Math.floor(W*H/1300*(PR==='drizzle'?0.35:PR==='sleet'?0.5:PR==='hail'?0.4:1)*(0.25+INT*1.6)),sl=0.1+wind*0.028,M=W+200;ctx.beginPath();for(let i=0;i<n;i++){const sp=520+rnd(i*3)*260,len=10+rnd(i*5)*10;const y=(rnd(i*7+1)*(H+40)+t*sp)%(H+40)-20;const x=(((rnd(i*11+2)*M+y*sl)%M)+M)%M-100;ctx.moveTo(x,y);ctx.lineTo(x+len*sl,y+len);}ctx.stroke();
    ctx.strokeStyle='rgba(215,228,245,0.5)';for(let i=0;i<W/18;i++){const ph=(t*1.6+rnd(i))%1;const x=rnd(i*13+seed)*W,y=g+4+rnd(i*17)*(H-g-4);ctx.globalAlpha=1-ph;ctx.beginPath();ctx.ellipse(x,y,ph*6*sc+1,ph*2*sc+0.5,0,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;}
  if((P.snow&&PR!=='none')||PR==='snow'){ctx.fillStyle='rgba(255,255,255,0.92)';ctx.beginPath();const BZ=FK==='blizzard',n=Math.floor(W*H/900*(PR==='sleet'?0.45:BZ?2.6:1)*(0.25+INT*1.5));for(let i=0;i<n;i++){const sp=25+rnd(i*3)*35;const y=(rnd(i*5+4)*(H+10)+t*sp)%(H+10)-5;const x=(((rnd(i*7+8)*W+t*wind*(BZ?14:3)+Math.sin(t*0.9+i)*8)%W)+W)%W;circ(x,y,Math.max(px*0.7,0.8+rnd(i*11)*1.9));}ctx.fill();}
  if(PR==='hail'){ctx.fillStyle='rgba(250,252,255,0.95)';ctx.beginPath();for(let i=0;i<W*H/2600*(0.3+INT*1.4);i++){const sp=620+rnd(i*3)*200,y=(rnd(i*7+5)*(H+20)+t*sp)%(H+20)-10,x=rnd(i*11+4)*W+y*0.05;circ(x,y,Math.max(px*0.8,2.2));}ctx.fill();for(let i=0;i<W/14;i++){const ph=(t*2+rnd(i))%1,x=rnd(i*13)*W,y=g+4+rnd(i*17)*(H-g-6)-Math.sin(ph*Math.PI)*10;ctx.globalAlpha=1-ph;ctx.beginPath();circ(x,y,Math.max(px*0.7,1.8));ctx.fill();}ctx.globalAlpha=1;}
  if(FK==='blizzard'){const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'rgba(235,240,248,0.25)');bg.addColorStop(1,'rgba(235,240,248,0.5)');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);}
  if(FK==='haze'){const hzG=ctx.createLinearGradient(0,0,0,H);hzG.addColorStop(0,'rgba(196,128,70,0.42)');hzG.addColorStop(0.6,'rgba(210,150,90,0.35)');hzG.addColorStop(1,'rgba(150,110,80,0.25)');ctx.fillStyle=hzG;ctx.fillRect(0,0,W,H);}
  if(fx&&(fx.storm==='1'||fx.storm==='storm')){const per=3.4,cy=Math.floor(t/per),ph=t-cy*per;if(ph<0.22){const a=(ph<0.06||(ph>0.1&&ph<0.14))?0.42:0.12;ctx.fillStyle='rgba(235,240,255,'+a+')';ctx.fillRect(0,0,W,H);let x=W*(0.15+rnd(cy*7)*0.7),y=0;ctx.strokeStyle='rgba(255,252,220,0.95)';ctx.lineWidth=Math.max(px,3);ctx.beginPath();ctx.moveTo(x,y);while(y<g-hs*0.4){y+=16+rnd(cy+y)*20;x+=(rnd(cy*3+y)-0.5)*38;ctx.lineTo(x,y);}ctx.stroke();}}
  if(P.flies){for(let i=0;i<Math.max(6,W/40);i++){const a=0.5+0.5*Math.sin(t*2+i*1.9);if(a<0.2)continue;const x=((rnd(i*3+1)*W+Math.sin(t*0.5+i)*14*sc+t*wind*1.5)%W+W)%W,y=g-4-rnd(i*9)*40*sc+Math.cos(t*0.7+i)*6*sc+rnd(i*21)*(H-g)*0.6;const r=Math.max(px*1.5,5*sc+2);const fg=ctx.createRadialGradient(x,y,0,x,y,r);fg.addColorStop(0,`rgba(236,244,140,${a})`);fg.addColorStop(1,'rgba(236,244,140,0)');ctx.fillStyle=fg;ctx.fillRect(x-r,y-r,r*2,r*2);}}
}

function stationLayout(t,f){const k=+f.dk||1,by=+f.dby,sx=+f.dsx,W=+f.vw||1000,wind=+f.wind||0,dir=(+f.dir||0)*Math.PI/180;
  const boxW=46*k,boxH=40*k,legH=42*k,boxTop=by-legH-boxH,mastTop=boxTop-84*k;
  const down=-Math.sign(Math.sin(dir))||1,wob=Math.sin(t*2.2)*0.035*Math.min(1.6,wind/10+0.3);
  const span=W+620*k,prog=((t/28)+0.62)%1,hx=-320*k+prog*span,hy=(+f.hby||100)+Math.sin(t*1.3)*6*k,bw=264*k,bh=28*k;
  return {k,by,sx,boxW,boxH,legH,boxTop,mastTop,heli:[hx,hy],
    L:[{cx:sx,cy:by-legH*0.5,w:96*k,h:40*k,a:0,kind:'board'},{cx:sx+down*40*k,cy:mastTop+36*k,w:104*k,h:34*k,a:wob,kind:'arrow',dir:down},{cx:hx-52*k-bw/2,cy:hy+16*k,w:bw,h:bh,a:Math.sin(t*1.8)*0.015,kind:'banner'}]};}
function ridgeY(u,cv,g,hs,seed){const lo=Math.min(...cv)-10,hi=Math.max(...cv)+4,X0=0.06,X1=0.94,Hv=v=>0.3+0.66*(v-lo)/(hi-lo);const q=Math.max(0,Math.min(11,(u-X0)/(X1-X0)*11)),i=Math.min(10,Math.floor(q)),f=q-i,c=(1-Math.cos(f*Math.PI))/2;const h=Hv(cv[i])*(1-c)+Hv(cv[i+1])*c;const e=u<X0?(X0-u)/X0:u>X1?(u-X1)/(1-X1):0;return g-hs*(h*(1-e*0.45)+0.018*Math.sin(u*97+seed)*Math.sin(u*31));}
function circ2(ctx,x,y,r){ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,Math.PI*2);}
function textOnRidge(ctx,str,x,R,off,sp,fill,shc,sw,posts,nodraw){const out=[];for(const ch of str){const w=ctx.measureText(ch).width;const cx=x+w/2,y=R(cx)-off,a=Math.max(-0.35,Math.min(0.35,Math.atan2(R(cx+36)-R(cx-36),72)))*(posts?0.15:1);out.push([ch,cx,y,a,w]);x+=w+sp;}
  if(nodraw)return x;
  if(posts)out.forEach(([ch,cx,y,a,w])=>{if(ch===' ')return;ctx.fillStyle=posts;const ps=[-0.3,0,0.3];ps.forEach(o=>{const px0=cx+o*w;ctx.fillRect(px0-1.5,y-12,3,R(px0)-y+14);});ctx.save();ctx.strokeStyle=posts;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx-0.3*w,y-6);ctx.lineTo(cx,R(cx)+1);ctx.lineTo(cx+0.3*w,y-6);ctx.moveTo(cx-0.3*w,R(cx-0.3*w)-2);ctx.lineTo(cx,y-6);ctx.lineTo(cx+0.3*w,R(cx+0.3*w)-2);ctx.stroke();ctx.restore();});
  out.forEach(([ch,cx,y,a])=>{ctx.save();ctx.translate(cx,y);ctx.rotate(a);if(posts){ctx.fillStyle='rgba(120,128,150,0.95)';ctx.fillText(ch,3,3);ctx.fillStyle='rgba(165,172,190,1)';ctx.fillText(ch,1.5,1.5);}if(shc){ctx.lineJoin='round';ctx.strokeStyle=shc;ctx.lineWidth=sw;ctx.strokeText(ch,0,0);}ctx.fillStyle=fill;ctx.fillText(ch,0,0);ctx.restore();});return x;}
function prefsOf(picks){if(!picks||!picks.length)return null;const ts=[];let wc=0,wn=0,cc=0,cn=0;picks.forEach(p=>{const pr=PAIRS[p.i];if(!pr)return;const [A,B]=pr;if(p.pick==='='){ts.push((A[1]+B[1])/2);return;}const w=p.pick==='A'?A:B,l=p.pick==='A'?B:A;ts.push(w[1]);wc+=l[2]-w[2];wn++;cc+=l[3]-w[3];cn++;});if(!ts.length)return null;return {ideal:Math.round(ts.reduce((a,b)=>a+b,0)/ts.length),windAvoid:wn?wc/wn:0,cloudAvoid:cn?cc/cn:0};}
function tuneAdj(P,pr){if(!pr)return 0;let d=(Math.abs(P.feels-70)-Math.abs(P.feels-pr.ideal))*0.9;if(pr.windAvoid>3)d-=Math.max(0,P.wind-8)*0.6;if(pr.windAvoid<-3)d+=Math.max(0,P.wind-8)*0.3;if(pr.cloudAvoid>15)d-=Math.max(0,P.clouds-50)*0.08;if(pr.cloudAvoid<-15)d+=Math.max(0,P.clouds-50)*0.05;return Math.round(Math.max(-15,Math.min(15,d)));}
let SKYPICK=null,ABNOW='',ABDONE=null;
const INTDEF={worst:1,drizzle:0.25,rain:0.55,storm:0.85,hail:0.6,sleet:0.5,freezing:0.5,blizzard:0.95};
function pkind(P){if(!P||P.precip==='none')return '';return P.precip||(P.cond==='rain'?'rain':P.cond==='snow'?'snow':'');}
const EV_CLIM={newyear:'winter',snowman:'winter',lunar:'winter',groundhog:'winter',valentine:'winter',stpatricks:'spring',spring:'spring',fools:'spring',easter:'spring',earthday:'spring',cinco:'spring',mothers:'spring',solstice:'summer',pride:'summer',fourth:'summer',moonland:'summer',perseids:'summer',dogday:'summer',school:'autumn',harvest:'autumn',autumn:'autumn',oktober:'autumn',halloween:'autumn',muertos:'autumn',thanks:'autumn',hanukkah:'winter',christmas:'winter'};
const EV_NAMES=[['newyear','new year’s'],['lunar','lunar new year'],['valentine','valentine’s'],['stpatricks','st. patrick’s'],['spring','cherry blossoms'],['easter','easter'],['earthday','earth day'],['pride','pride'],['fourth','fourth of july'],['perseids','meteor shower'],['harvest','harvest moon'],['halloween','halloween'],['thanks','thanksgiving'],['hanukkah','hanukkah'],['christmas','christmas']];
function climateOf(d){const mo=d.getMonth()+1;return mo===12||mo<=2?'winter':mo<=5?'spring':mo<=8?'summer':'autumn';}
function eventOn(d){const mo=d.getMonth()+1,da=d.getDate(),y=d.getFullYear(),day=new Date(y,mo-1,da);const near=(m,dd,r)=>Math.abs((day-new Date(y,m-1,dd))/864e5)<=r;const nth=(m,wd,n)=>{const f=new Date(y,m-1,1),o=(wd-f.getDay()+7)%7;return 1+o+(n-1)*7;};
  const LNY={2026:[2,17],2027:[2,6],2028:[1,26],2029:[2,13],2030:[2,3]}[y],EAS={2026:[4,5],2027:[3,28],2028:[4,16],2029:[4,1],2030:[4,21]}[y],HAN={2026:[12,4],2027:[12,24],2028:[12,12],2029:[12,1],2030:[12,20]}[y];
  if((mo===12&&da>=31)||(mo===1&&da<=2))return 'newyear';if(LNY&&near(LNY[0],LNY[1],3))return 'lunar';if(mo===2&&da>=7&&da<=14)return 'valentine';
  if(mo===3&&da>=14&&da<=17)return 'stpatricks';if(EAS&&near(EAS[0],EAS[1],2))return 'easter';if(mo===4&&da>=20&&da<=22)return 'earthday';
  if(mo===7&&da<=5)return 'fourth';if(mo===8&&da>=10&&da<=14)return 'perseids';
  if(mo===9&&da>=18&&da<=24)return 'harvest';if(mo===10&&da>=15)return 'halloween';if(mo===11&&Math.abs(da-nth(11,4,4))<=2)return 'thanks';
  if(HAN&&day>=new Date(y,HAN[0]-1,HAN[1])&&day<=new Date(y,HAN[0]-1,HAN[1]+8))return 'hanukkah';if(mo===12&&da<=26&&da>=10)return 'christmas';
  if(mo===6)return 'pride';if((mo===3&&da>=20)||mo===4||(mo===5&&da<=15))return 'spring';if((mo===9&&da>=22)||mo===10||mo===11)return 'autumn';return '';}
function seasonNow(sel){const d=new Date();if(sel==='none')return '|'+climateOf(d);if(sel&&sel.startsWith('clim:'))return '|'+sel.slice(5);if(sel&&sel!=='auto')return sel+'|'+(EV_CLIM[sel]||climateOf(d));return eventOn(d)+'|'+climateOf(d);}
function splitSea(v){const p=String(v||'').split('|');return [p[0]||'',p[1]||''];}
function climPal(cond,sea){const cl=splitSea(sea)[1];const base=PAL[cond]||PAL.sunny;if(!cl||base.snowy||cl==='spring')return base;const k=cond+'#'+cl;if(PAL[k])return PAL[k];const nt=/@n$/.test(cond),N='#0e1424',dk=c=>nt?mixHex(c,N,0.55):c;const o={...base};
  if(cl==='summer'){o.g0=dk('#6cc24a');o.g1=dk('#3f9a35');o.blades=['#4aa83a','#66c24a','#86da5e'].map(dk);o.land=dk('#5fae4a');o.dark=dk('#2f7a34');o.flowers=1;}
  if(cl==='winter'){o.g0=dk('#a8a077');o.g1=dk('#827a55');o.blades=['#8c845a','#a69d6d','#c0b686'].map(dk);o.land=dk('#8f8f6a');o.dark=dk('#46523e');o.flowers=0;o.leaves=0;}
  if(cl==='autumn'){o.blades=(base.blades||[]).map(c=>mixHex(c,dk('#b8a24a'),0.3));o.g0=mixHex(base.g0,dk('#b3a150'),0.25);o.g1=mixHex(base.g1,dk('#8a7a3a'),0.25);}
  PAL[k]=o;return o;}
function mixHex(a,b,t){const A=hx(a),B=hx(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function nightKey(cond){const k=cond+'@n';if(PAL[k])return k;const p=PAL[cond]||PAL.sunny,out={...p},N='#0e1424';
  const sky=p.ceil||p.fog?['#1b2030','#2a3042','#3b4254']:['#0b1030','#1f2856','#3d4a7c'];out.sky=p.sky.map((c,i)=>mixHex(c,sky[i],0.82));
  ['land','dark','g0','g1','path','house','roof'].forEach(f=>{if(p[f])out[f]=mixHex(p[f],N,0.55);});
  out.blades=(p.blades||[]).map(c=>mixHex(c,N,0.55));out.cloud=mixHex(p.cloud,p.ceil?'#3a4254':'#39406e',0.7);out.shade=mixHex(p.shade,'#22283e',0.7);
  out.sun=0;out.sunset=0;out.heat=0;out.moon=!p.ceil&&!p.fog?1:0;out.stars=!p.ceil&&!p.fog?1:0;out.lit=1;out.smoke=1;out.flies=(cond==='sunny'||cond==='partly'||cond==='heat')?1:0;if(p.caps)out.caps=p.caps*0.6;
  PAL[k]=out;return k;}
function woodTex(){return pix('woodtex6',()=>{const d=(typeof document!=='undefined')&&document;if(!d)return '';const W=64,H=30,cv=d.createElement('canvas');cv.width=W;cv.height=H;const ctx=cv.getContext('2d'),im=ctx.createImageData(W,H),D=im.data;
  const h2=(x,y)=>rnd(x*57.13+y*311.7),sm=t=>t*t*(3-2*t);
  const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=sm(x-xi),yf=sm(y-yi);const a=h2(xi,yi),b=h2(xi+1,yi),c=h2(xi,yi+1),e=h2(xi+1,yi+1);return a+(b-a)*xf+(c-a)*yf+(a-b-c+e)*xf*yf;};
  const PH=6,NP=H/PH,tones=[[168,116,63],[160,110,59],[172,119,66],[164,113,61],[156,106,57]];
  const joints=[...Array(NP)].map((_,p)=>Math.floor(8+rnd(p*9+2)*48)),knots=[...Array(NP)].map(()=>null);
  for(let y=0;y<H;y++){const p=Math.floor(y/PH),py=y-p*PH,b=tones[p%tones.length],seg=(x)=>x<joints[p]?0:1;
    for(let x=0;x<W;x++){const sg=seg(x),oy=p*40+sg*17;let warp=0;const k=knots[p];let dk=99;if(k){const dx=x-k[0],dy=(y-k[1])*2.6;dk=Math.sqrt(dx*dx+dy*dy);warp=8/(dk+2)*Math.sign(y-k[1]||1);}
      const gy=y+warp+vn(x/70+sg*9,oy)*3;
      let n=vn(x/10+sg*5,gy/0.6+oy)*0.6+vn(x/3+sg*3,gy/0.5+oy)*0.4;
      let f=0.93+n*0.12;const streak=vn(x/90+sg,gy/0.9+oy*2);if(streak>0.75)f*=0.95;
      if(k&&dk<3){f*=0.84+0.06*Math.round((Math.sin(dk*1.6)*0.5+0.5)*2)/2;}
      f=Math.round(f*10)/10;
      if(py===PH-1)f=0.72;
      if(x===joints[p])f=0.74;
      
      const i=(y*W+x)*4;D[i]=Math.min(255,b[0]*f);D[i+1]=Math.min(255,b[1]*f);D[i+2]=Math.min(255,b[2]*f);D[i+3]=255;}}
  ctx.putImageData(im,0,0);joints.forEach((jx,p)=>{[jx-2,jx+2].forEach(x=>{const y=p*PH+2;ctx.fillStyle='#5e3c20';ctx.fillRect(x,y,1,1);});});
  return cv.toDataURL();});}
function drawMeadow(ctx,W,H,cond,t,wind,SEAV,px,pl,pr,kx,ky,fx){const SEA=splitSea(SEAV)[0];drawMeadow0(ctx,W,H,cond,t,wind,SEAV,px,pl,pr,kx,ky);
  const P=climPal(cond,SEAV),PR=fx.precip,INT=fx.int!==undefined&&fx.int!==''?+fx.int:0.5;
  const WET=PR!=='none'&&(P.rain||PR==='rain'||PR==='drizzle'||PR==='sleet'),SNW=PR!=='none'&&PR!=='sleet'&&(P.snow||PR==='snow');
  if(SNW){if(INT<0.35){ctx.fillStyle='rgba(248,250,253,0.92)';const n=Math.round(W*H/4000*(0.4+INT*3));for(let i=0;i<n;i++){const x=rnd(i*29+3)*W,y=rnd(i*31+1)*H,r=(3+rnd(i*7)*9)*(0.5+INT*2);ctx.beginPath();ctx.ellipse(x,y,r,r*0.35,0,0,Math.PI*2);ctx.fill();}}
    else{const sg=ctx.createLinearGradient(0,0,0,H);sg.addColorStop(0,'rgba(246,249,253,0.97)');sg.addColorStop(1,'rgba(226,234,244,0.97)');ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);
      ctx.fillStyle='rgba(170,190,215,0.35)';for(let i=0;i<W*H/9000;i++){ctx.beginPath();ctx.ellipse(rnd(i*17+2)*W,rnd(i*19+5)*H,(14+rnd(i)*20),2.4,0,0,Math.PI*2);ctx.fill();}
      if(INT<0.65){ctx.strokeStyle=(P.blades||['#6a7a5a'])[0];ctx.lineWidth=Math.max(px*0.9,1.4);ctx.beginPath();const k=(0.65-INT)/0.3;for(let i=0;i<W*H/900*k;i++){const x=rnd(i*13+7)*W,y=rnd(i*17+3)*H;ctx.moveTo(x,y);ctx.lineTo(x+1,y-4-rnd(i)*5);}ctx.stroke();}}}
  if(WET){const pc=mix(P.sky[1],'#dfe8f2',0.25),pd=mix(P.sky[0],'#20283a',0.2);
    if(INT>0.6){const lv=(INT-0.6)/0.4;ctx.fillStyle='rgba(22,28,25,'+(0.2+lv*0.28)+')';ctx.fillRect(0,0,W,H);}
    const np=Math.round(W*H/40000*(0.25+INT*1.9));for(let i=0;i<np;i++){const x=rnd(i*37+11)*W,y=rnd(i*41+7)*H,rw=(8+rnd(i*43)*22)*(0.35+INT*1.3),rh=rw*0.24;ctx.fillStyle=pd;ctx.beginPath();ctx.ellipse(x,y+1,rw,rh,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=pc;ctx.beginPath();ctx.ellipse(x,y,rw*0.94,rh*0.82,0,0,Math.PI*2);ctx.fill();
      const ph=(t*1.4+rnd(i))%1;ctx.strokeStyle='rgba(255,255,255,'+(0.5*(1-ph))+')';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x+rw*0.2,y,rw*0.5*ph+1,rh*0.5*ph+0.5,0,0,Math.PI*2);ctx.stroke();}
    ctx.strokeStyle='rgba(215,228,245,0.5)';ctx.lineWidth=Math.max(1,px*0.8);const n=Math.floor(W*H/1300*(PR==='drizzle'?0.35:PR==='sleet'?0.5:1)*(0.25+INT*1.6)),sl=0.1+wind*0.028;ctx.beginPath();for(let i=0;i<n;i++){const sp=520+rnd(i*3)*260,len=10+rnd(i*5)*10,y=(rnd(i*7+1)*(H+40)+t*sp)%(H+40)-20,x=((rnd(i*11+2)*(W+200)+y*sl)%(W+200))-100;ctx.moveTo(x,y);ctx.lineTo(x+len*sl,y+len);}ctx.stroke();}
  if(SNW){ctx.fillStyle='rgba(255,255,255,0.92)';ctx.beginPath();const BZ=fx.storm==='blizzard',n=Math.floor(W*H/900*(BZ?2.6:1)*(0.25+INT*1.5));for(let i=0;i<n;i++){const sp=25+rnd(i*3)*35,y=(rnd(i*5+4)*(H+10)+t*sp)%(H+10)-5,x=(((rnd(i*7+8)*W+t*wind*(BZ?14:3)+Math.sin(t*0.9+i)*8)%W)+W)%W;const r=Math.max(px*0.7,0.8+rnd(i*11)*1.9);ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,Math.PI*2);}ctx.fill();}
}
function drawMeadow0(ctx,W,H,cond,t,wind,SEAV,px,pl,pr,kx,ky){const SEA=splitSea(SEAV)[0],CLIM=splitSea(SEAV)[1],P=climPal(cond,SEAV),circ=(x,y,r)=>{ctx.moveTo(x+r,y);ctx.arc(x,y,Math.max(0.1,r),0,Math.PI*2);};
  const gg=ctx.createLinearGradient(0,0,0,H);gg.addColorStop(0,P.g1);gg.addColorStop(Math.min(1,500/H),P.g1);gg.addColorStop(1,mix(P.g1,'#0e1a0e',0.22));ctx.fillStyle=gg;ctx.fillRect(0,0,W,H);
  if(pr>pl){const L=46,cx=(pl+pr)/2+(pr-pl)*0.12;const pg=ctx.createLinearGradient(0,0,0,L);pg.addColorStop(0,rgba(P.path,0.7));pg.addColorStop(1,rgba(P.path,0));ctx.fillStyle=pg;ctx.beginPath();ctx.moveTo(pl,-1);ctx.bezierCurveTo(pl+(pr-pl)*0.15,L*0.5,cx-(pr-pl)*0.2,L*0.9,cx,L);ctx.bezierCurveTo(cx+(pr-pl)*0.2,L*0.9,pr-(pr-pl)*0.12,L*0.5,pr,-1);ctx.closePath();ctx.fill();
}
    const cols=P.blades,paths=cols.map(()=>new Path2D()),gs=0.9+wind*0.12;
  for(let i=0;i<W*H/(P.sparse?1600:320);i++){const x=rnd(i*13+7)*W,y=rnd(i*17+3)*(H+40),h=30+rnd(i*19)*14;const gust=Math.sin(x*0.012-t*gs)*0.5+0.5;const bend=Math.min(1.1,wind*0.02+gust*(0.04+wind*0.022)+Math.sin(t*2.3+x*0.3)*0.04);paths[i%cols.length].moveTo(x,y);paths[i%cols.length].quadraticCurveTo(x+bend*h*0.2,y-h*0.6,x+bend*h,y-h*(1-bend*0.3));}
  ctx.lineCap='round';cols.forEach((c,i)=>{ctx.strokeStyle=c;ctx.lineWidth=Math.max(px*0.9,1.4);ctx.stroke(paths[i]);});
  if(pr>pl){const cx=(pl+pr)/2+(pr-pl)*0.12;    const rk=mix(P.path,'#4a3a2c',0.5),rl=mix(P.path,'#ffffff',0.25);for(let k=0;k<16;k++){const f=rnd(k*7+3),y=18+Math.pow(rnd(k*11+1),1.4)*150,spread=(pr-pl)*(0.5-Math.min(0.42,y/400)),x=cx+(rnd(k*5+2)-0.5)*spread*1.6,r=(2.5+rnd(k*13)*3.5)*(1-y/260);if(r<1)continue;ctx.fillStyle=rk;ctx.beginPath();ctx.ellipse(x,y,r*1.4,r,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=rl;ctx.fillRect(x-r*0.6,y-r*0.6,Math.max(px*0.6,r*0.6),Math.max(px*0.5,r*0.4));}}
  const FC=SEA==='spring'?['#f6b9d0','#fbe0ea','#e58fb0']:SEA==='autumn'||SEA==='halloween'?['#d9772e','#b8452e','#e8b33c']:['#f6e27a','#fbf6ec','#e79bb0'];
  if(P.flowers||SEA){for(let i=0;i<W*H/5000;i++){ctx.fillStyle=FC[i%3];ctx.beginPath();circ(rnd(i*23+5)*W,rnd(i*29+1)*H,Math.max(px*0.8,3));ctx.fill();}}
  if(CLIM==='autumn'&&!P.snowy){const LC=['#d9772e','#b8452e','#e8b33c','#9a3f24','#c9602a'];for(let i=0;i<W*H/1400;i++){const x=rnd(i*29+3)*W,y=rnd(i*37+9)*H,r=3+rnd(i*5)*3.5;ctx.fillStyle=LC[i%5];ctx.beginPath();ctx.ellipse(x,y,r*1.5,r*0.7,rnd(i*3)*3,0,Math.PI*2);ctx.fill();}}
  if(SEA==='stpatricks'){for(let i=0;i<W*H/3000;i++){const x=rnd(i*31+2)*W,y=rnd(i*17+5)*H,r=3+rnd(i)*2;ctx.fillStyle=i%9===0?'#2f8a3e':'#3fa24e';ctx.beginPath();circ(x-r*0.8,y,r);circ(x+r*0.8,y,r);circ(x,y-r*1.1,r);ctx.fill();}}
  if(SEA==='christmas'&&!P.snowy){ctx.fillStyle='rgba(255,255,255,0.8)';for(let i=0;i<W*H/2400;i++){ctx.beginPath();ctx.ellipse(rnd(i*7)*W,rnd(i*11)*H,6+rnd(i)*10,2+rnd(i*3)*3,0,0,Math.PI*2);ctx.fill();}}
  if(SEA==='autumn'||SEA==='halloween'||SEA==='spring'){for(let i=0;i<18;i++){const sp=16+rnd(i*3)*20,y=(rnd(i*7)*(H+60)+t*sp)%(H+60)-30,x=((rnd(i*11)*W+t*(8+wind*3)+Math.sin(t*1.6+i)*18)%W+W)%W;ctx.save();ctx.translate(x,y);ctx.rotate(t*2.5+i);ctx.fillStyle=FC[i%3];ctx.beginPath();ctx.ellipse(0,0,Math.max(px,4.5),Math.max(px*0.6,2.2),0,0,Math.PI*2);ctx.fill();ctx.restore();}}}
function drawSigns(ctx,W,H,t,f,px){ctx.clearRect(0,0,W,H);const S=stationLayout(t,f),K=S.k,night=f.cond==='night';
  const txt=(q,a,b,big,small,col,sh,row)=>{ctx.save();ctx.translate(q.cx-(q.kind==='arrow'?q.dir*q.h*0.22:0),q.cy);ctx.rotate(q.a);ctx.textAlign='center';ctx.textBaseline='middle';
    const draw=(str,y,sz)=>{ctx.font=sz+"px 'Patrick Hand', cursive";ctx.lineJoin='round';if(sh){ctx.strokeStyle=sh;ctx.lineWidth=Math.max(2,2.6*K);ctx.strokeText(str,0,y+Math.max(1,1.2*K));ctx.fillStyle=sh;ctx.fillText(str,0,y+Math.max(1,1.4*K));}ctx.strokeStyle=col;ctx.lineWidth=Math.max(0.6,0.7*K);ctx.strokeText(str,0,y);ctx.fillStyle=col;ctx.fillText(str,0,y);};
    if(row){ctx.font=big+"px 'Patrick Hand', cursive";const w1=ctx.measureText(a+' ').width;ctx.font=small+"px 'Patrick Hand', cursive";const w2=ctx.measureText(b).width;ctx.textAlign='left';const x0=-(w1+w2)/2;ctx.font=big+"px 'Patrick Hand', cursive";ctx.fillStyle=col;ctx.strokeStyle=col;ctx.lineWidth=Math.max(0.6,0.8*K);ctx.strokeText(a,x0,1*K);ctx.fillText(a,x0,1*K);ctx.font=small+"px 'Patrick Hand', cursive";ctx.fillStyle='#6b4a3a';ctx.fillText(b,x0+w1,1*K);}
    else{draw(a,-q.h*0.14,big);draw(b,q.h*0.26,small);}ctx.restore();};
  const wc='#fff6e2',ws='#3a1f0c';
  txt(S.L[0],f.s0a,f.s0b,Math.round(23*K),Math.round(15*K),wc,ws);
  txt(S.L[1],f.s1a,f.s1b,Math.round(18*K),Math.round(13*K),wc,ws);
  txt(S.L[2],f.s2a,f.s2b,Math.round(19*K),Math.round(16*K),'#3b2a2a',null,true);}
// u: 0 = kite in hand, 1 = flying
function drawKite(ctx,W,hx,hy,k,t,px,u=1){const kx0=Math.min(W-40*k,hx+170*k+Math.sin(t*1.1)*18*k),ky0=Math.max(50*k,hy-250*k)+Math.cos(t*1.6)*12*k,kx=hx+(kx0-hx)*u,ky=hy+(ky0-hy)*u;const rot=Math.sin(t*1.3)*0.18;
    ctx.strokeStyle='rgba(251,246,236,0.85)';ctx.lineWidth=Math.max(px*0.7,1);ctx.beginPath();ctx.moveTo(hx,hy);ctx.quadraticCurveTo((hx+kx)/2+30*k,(hy+ky)/2+50*k,kx,ky+20*k);ctx.stroke();
    ctx.save();ctx.translate(kx,ky);ctx.rotate(rot);
    const q=[[0,-24],[16,0],[0,28],[-16,0]].map(([a,b])=>[a*k,b*k]);const cols=['#e8604c','#f2c230','#e8604c','#4f8fbf'];
    for(let i=0;i<4;i++){ctx.fillStyle=cols[i];ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(...q[i]);ctx.lineTo(...q[(i+1)%4]);ctx.closePath();ctx.fill();}
    ctx.strokeStyle='#2b2340';ctx.lineWidth=Math.max(px*0.7,1.5*k);ctx.beginPath();ctx.moveTo(...q[0]);ctx.lineTo(...q[1]);ctx.lineTo(...q[2]);ctx.lineTo(...q[3]);ctx.closePath();ctx.moveTo(...q[0]);ctx.lineTo(...q[2]);ctx.moveTo(...q[1]);ctx.lineTo(...q[3]);ctx.stroke();
    ctx.strokeStyle='#fbf6ec';ctx.beginPath();ctx.moveTo(0,28*k);for(let i=1;i<=6;i++)ctx.lineTo(Math.sin(t*4+i)*8*k-i*4*k,28*k+i*10*k);ctx.stroke();
    for(let i=1;i<=6;i+=2){ctx.fillStyle=i%4===1?'#e8604c':'#f2c230';const bx=Math.sin(t*4+i)*8*k-i*4*k,by=28*k+i*10*k;ctx.beginPath();ctx.moveTo(bx-5*k,by-3*k);ctx.lineTo(bx+5*k,by+3*k);ctx.lineTo(bx+5*k,by-3*k);ctx.lineTo(bx-5*k,by+3*k);ctx.closePath();ctx.fill();}
    ctx.restore();}
function drawFx(ctx,W,H,t,f,px){
  ctx.clearRect(0,0,W,H);const s=+f.sc||4,k=s/4,act=f.act,mood=f.mood;
  const circ=(x,y,r)=>{ctx.moveTo(x+r,y);ctx.arc(x,y,Math.max(0.1,r),0,Math.PI*2);};
  const I=+f.int||0,PK=f.pkind||'',ax=+f.ax2,gy=+f.gy,aT=+f.heady-16*s;
  if(PK==='snow'&&I>0.62&&ax&&gy){const lv=Math.min(1,(I-0.62)/0.34),chin=aT+24*s,top=gy-lv*(gy-chin),w=(30+lv*26)*s,hx=+f.headx,q=Math.max(px,s*0.5);
    const prof=x=>{const u=(x-ax)/w;if(Math.abs(u)>=1)return gy+2*s;const base=Math.pow(Math.cos(u*Math.PI/2),0.9+0.5*(1-lv));let y=gy-(gy-top)*base;y+=Math.sin(u*9.3+1.7)*1.1*s*base+Math.sin(u*23+0.4)*0.5*s*base;if(Math.abs(x-hx)<7*s&&lv>0.5)y=Math.max(y,chin-0.5*s+Math.abs(x-hx)*0.12);return y;};
    const span=[];for(let x=ax-w;x<=ax+w;x+=q)span.push([x,prof(x)]);
    const path=(dy)=>{ctx.beginPath();ctx.moveTo(ax-w-4*s,gy+3*s);span.forEach(([x,y])=>ctx.lineTo(x,y+dy));ctx.lineTo(ax+w+4*s,gy+3*s);ctx.closePath();};
    ctx.fillStyle='rgba(70,90,130,0.22)';ctx.beginPath();ctx.ellipse(ax+w*0.18,gy+2.5*s,w*1.05,3*s,0,0,Math.PI*2);ctx.fill();
    path(0);const gr=ctx.createLinearGradient(ax-w,0,ax+w,0);gr.addColorStop(0,'#eef4fb');gr.addColorStop(0.42,'#f8fbff');gr.addColorStop(0.7,'#dbe6f3');gr.addColorStop(1,'#b8c9df');ctx.fillStyle=gr;ctx.fill();
    ctx.save();path(0);ctx.clip();const vg=ctx.createLinearGradient(0,top,0,gy+3*s);vg.addColorStop(0,'rgba(255,255,255,0)');vg.addColorStop(1,'rgba(150,172,205,0.45)');ctx.fillStyle=vg;ctx.fillRect(ax-w-5*s,top-2*s,w*2+10*s,gy-top+6*s);
    for(let j=0;j<4;j++){const xs=ax-w*0.75+j*w*0.45+Math.sin(j*3.1)*4*s,yy=prof(xs);ctx.fillStyle='rgba(160,182,212,0.35)';ctx.beginPath();ctx.ellipse(xs+5*s,yy+(gy-yy)*0.45,5*s,(gy-yy)*0.35+1,0.25,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='rgba(120,150,195,0.35)';ctx.beginPath();ctx.ellipse(hx+3*s,chin+2*s,7*s,2.2*s,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
    ctx.fillStyle='#ffffff';span.forEach(([x,y],i)=>{if(x<ax+w*0.35)ctx.fillRect(x,y,q,q);});
    for(let i=0;i<14;i++){const u=rnd(i*13+3)*2-1,x=ax+u*w*0.9,yt=prof(x),y=yt+rnd(i*7)*(gy-yt)*0.8;const tw=0.5+0.5*Math.sin(t*3+i*2.3);if(tw<0.55)continue;ctx.fillStyle='rgba(255,255,255,'+tw+')';ctx.fillRect(x,y,q,q);ctx.fillStyle='rgba(200,225,255,'+(tw*0.8)+')';ctx.fillRect(x-q,y,q,q);ctx.fillRect(x+q,y,q,q);}
    if(lv>0.3){const hy=aT+5*s,cw=8.5*s*Math.min(1,lv+0.35);ctx.fillStyle='#b9cae0';ctx.beginPath();ctx.ellipse(hx+1*s,hy+0.6*s,cw,2.6*s,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#f6f9fd';ctx.beginPath();ctx.ellipse(hx,hy,cw,2.8*s,0,Math.PI,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(hx-1.5*s,hy-1.6*s,cw*0.55,1.8*s,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff';ctx.fillRect(hx-cw*0.5,hy-2.6*s,cw*0.4,q);}
    for(let i=0;i<3;i++){const ph=(t*0.9+i/3)%1;if(ph>0.9)continue;ctx.fillStyle='rgba(248,251,255,'+(1-ph)*0.9+')';const x=ax+(i-1)*w*0.5+ph*6*s,y=prof(ax+(i-1)*w*0.5)-2*s-ph*4*s;ctx.fillRect(x,y,q,q);}}
  if((PK==='rain'||PK==='drizzle'||PK==='sleet')&&I>0.62&&ax&&gy){const lv=Math.min(1,(I-0.62)/0.34),hx=+f.headx;
    const src=[[hx-9*s,aT+22*s],[hx+9*s,aT+22*s],[hx-5*s,aT+24*s],[hx+6*s,aT+23*s],[ax-9*s,aT+38*s],[ax+10*s,aT+38*s],[ax-6*s,aT+40*s],[ax+5*s,aT+41*s],[ax-2*s,aT+44*s]];
    ctx.fillStyle='#9fd0f2';src.forEach(([x0,y0],i)=>{if(i/src.length>0.35+lv*0.65)return;for(let j=0;j<2;j++){const ph=(t*(1.1+rnd(i)*0.6)+rnd(i*7)+j*0.5)%1,y=y0+ph*ph*(gy-y0),r=(0.9+rnd(i*3)*0.5)*s*0.8;ctx.globalAlpha=Math.min(1,(1-ph)*1.6);ctx.beginPath();ctx.moveTo(x0,y-r*2.2);ctx.quadraticCurveTo(x0+r,y-r*0.3,x0,y+r);ctx.quadraticCurveTo(x0-r,y-r*0.3,x0,y-r*2.2);ctx.fill();}});ctx.globalAlpha=1;
    ctx.fillStyle='rgba(180,215,245,0.55)';for(let i=0;i<6;i++)ctx.fillRect(hx-8*s+i*3*s,aT+(6+rnd(i)*4)*s,Math.max(px,0.8*s),(2+rnd(i*3)*3)*s);
    ctx.fillStyle='rgba(120,160,200,'+(0.35+lv*0.3)+')';ctx.beginPath();ctx.ellipse(ax,gy+1.5*s,(14+lv*10)*s,(2+lv)*s,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(230,242,252,0.5)';ctx.fillRect(ax-8*s,gy+0.8*s,6*s,Math.max(px,0.6*s));
    for(let i=0;i<3;i++){const ph=(t*1.4+i/3)%1;ctx.strokeStyle='rgba(230,242,252,'+(0.7*(1-ph))+')';ctx.lineWidth=Math.max(px*0.6,1);ctx.beginPath();ctx.ellipse(ax+(i-1)*9*s,gy+1.5*s,ph*6*s+1,ph*1.6*s+0.5,0,0,Math.PI*2);ctx.stroke();}}
  if(f.dby){const S=stationLayout(t,f),{by,sx,boxW,boxH,legH,boxTop,mastTop,L}=S,K=S.k,temp=+f.temp||60,wind=+f.wind||0,night=f.cond==='night';
    const wood=night?['#5a3f2a','#43301f','#6e4e35']:['#9a6a3a','#744b27','#b98550'],metal=night?'#c3cad6':'#5a606c';
    const R=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
    const board=s=>{ctx.save();ctx.translate(s.cx,s.cy);ctx.rotate(s.a);if(s.dir<0)ctx.scale(-1,1);const w=s.w,h=s.h;ctx.beginPath();if(s.kind==='arrow'){ctx.moveTo(-w/2,-h/2);ctx.lineTo(w/2-h*0.5,-h/2);ctx.lineTo(w/2,0);ctx.lineTo(w/2-h*0.5,h/2);ctx.lineTo(-w/2,h/2);ctx.closePath();}else ctx.roundRect(-w/2,-h/2,w,h,4*K);
      ctx.fillStyle=wood[0];ctx.fill();ctx.lineWidth=Math.max(px,2*K);ctx.strokeStyle=wood[1];ctx.stroke();ctx.save();ctx.clip();ctx.fillStyle=wood[2];ctx.fillRect(-w/2,-h/2,w,Math.max(px,2.5*K));ctx.fillStyle=wood[1];for(let i=0;i<4;i++)ctx.fillRect(-w/2+rnd(i*7+3)*w*0.8,-h/2+(0.3+rnd(i*3+1)*0.55)*h,(8+rnd(i)*14)*K,Math.max(px*0.6,1*K));ctx.restore();
      ctx.fillStyle='#d9c29a';ctx.fillRect(-w/2+4*K,-2*K,Math.max(px,2.5*K),Math.max(px,2.5*K));if(s.kind==='board')ctx.fillRect(w/2-7*K,-2*K,Math.max(px,2.5*K),Math.max(px,2.5*K));ctx.restore();};
    [-0.36,0.36].forEach(o=>R(sx+o*boxW-2.5*K,boxTop+boxH,5*K,legH+2*K,wood[1]));R(sx-boxW*0.36,by-legH*0.15,boxW*0.72,3*K,wood[1]);
    R(sx-1.8*K,mastTop,3.6*K,boxTop-mastTop,metal);if(night){R(sx-1.8*K,mastTop,1.2*K,boxTop-mastTop,'#eef2f8');for(let yy=mastTop+14*K;yy<boxTop-4*K;yy+=16*K)R(sx-3*K,yy,6*K,2*K,'#8f97a6');}
    R(sx-boxW/2,boxTop,boxW,boxH,night?'#bdb8c8':'#efe9dd');ctx.fillStyle=night?'#8f8aa0':'#c9c1b1';for(let y=boxTop+6*K;y<boxTop+boxH-3*K;y+=5*K)ctx.fillRect(sx-boxW/2+4*K,y,boxW-8*K,Math.max(px*0.6,1.4*K));
    ctx.fillStyle=night?'#6a5f5a':'#7a4f3a';ctx.beginPath();ctx.moveTo(sx-boxW/2-5*K,boxTop+1*K);ctx.lineTo(sx+boxW/2+5*K,boxTop+1*K);ctx.lineTo(sx+boxW/2-2*K,boxTop-8*K);ctx.lineTo(sx-boxW/2+2*K,boxTop-8*K);ctx.closePath();ctx.fill();
    if(Math.floor(t*1.5)%2)R(sx-boxW/2+5*K,boxTop+boxH-7*K,Math.max(px,3*K),Math.max(px,3*K),'#7fe08a');
    {const x=sx+boxW/2+8*K,tt=boxTop-4*K,tb=boxTop+boxH-8*K;R(x-5*K,tt-3*K,10*K,tb-tt+12*K,'#fbf7ee');ctx.strokeStyle='#3b2a2a';ctx.lineWidth=Math.max(px,1.4*K);ctx.strokeRect(x-5*K,tt-3*K,10*K,tb-tt+12*K);
      R(x-1.8*K,tt,3.6*K,tb-tt,'#d9e2ec');const fr=Math.max(0.05,Math.min(1,(temp+10)/120)),ly=tb-fr*(tb-tt),tc=temp<40?'#5b93d0':'#dd4b3e';R(x-1.8*K,ly,3.6*K,tb-ly+2*K,tc);ctx.fillStyle=tc;ctx.beginPath();circ(x,tb+3*K,4.2*K);ctx.fill();
      if(temp>=90){const hg=ctx.createRadialGradient(x,tb,0,x,tb,22*K);hg.addColorStop(0,'rgba(255,120,80,0.5)');hg.addColorStop(1,'rgba(255,120,80,0)');ctx.fillStyle=hg;ctx.fillRect(x-22*K,tb-22*K,44*K,44*K);}
      if(temp<32)R(sx-boxW/2-5*K,boxTop-11*K,boxW+10*K,4*K,'rgba(255,255,255,0.95)');}
    {const hy=mastTop,rot=t*(0.8+wind*0.45);[0,1,2].map(i=>{const a=rot+i*2.094;return [Math.cos(a)*22*K,Math.sin(a)*5*K,Math.sin(a)];}).sort((a,b)=>a[1]-b[1]).forEach(([ex,ey,fr])=>{ctx.strokeStyle=metal;ctx.lineWidth=Math.max(px,1.8*K);ctx.beginPath();ctx.moveTo(sx,hy);ctx.lineTo(sx+ex,hy+ey);ctx.stroke();ctx.fillStyle=fr>0?'#f1ece2':'#b9b2a4';ctx.beginPath();circ(sx+ex,hy+ey,6*K);ctx.fill();ctx.fillStyle=fr>0?'#c9c2b4':'#8f887b';ctx.beginPath();circ(sx+ex+(ex>0?1.6:-1.6)*K,hy+ey,3.2*K);ctx.fill();});
      ctx.fillStyle=night?'#8f97a6':'#2b2f38';ctx.beginPath();circ(sx,hy,3.8*K);ctx.fill();if(night&&Math.floor(t*1.4)%2){const gl=ctx.createRadialGradient(sx,hy-7*K,0,sx,hy-7*K,10*K);gl.addColorStop(0,'rgba(255,90,70,0.7)');gl.addColorStop(1,'rgba(255,90,70,0)');ctx.fillStyle=gl;ctx.fillRect(sx-10*K,hy-17*K,20*K,20*K);ctx.fillStyle='#ff5a46';ctx.beginPath();circ(sx,hy-7*K,2.2*K);ctx.fill();}}
    board(L[0]);board(L[1]);
    {const [hx,hy]=S.heli,b=L[2],bl=b.cx-b.w/2,br=b.cx+b.w/2;
      ctx.strokeStyle=night?'#9a8f80':'#6b5a4a';ctx.lineWidth=Math.max(px*0.7,1.2*K);ctx.beginPath();ctx.moveTo(hx-14*K,hy+9*K);ctx.lineTo(br,b.cy-b.h/2);ctx.moveTo(hx-14*K,hy+9*K);ctx.lineTo(br,b.cy+b.h/2);ctx.stroke();
      const wv=x=>Math.sin(x*0.045-t*6)*2.6*K*((br-x)/b.w);ctx.fillStyle='#fbf1dc';ctx.beginPath();ctx.moveTo(br,b.cy-b.h/2);for(let x=br;x>=bl;x-=6)ctx.lineTo(x,b.cy-b.h/2+wv(x));for(let x=bl;x<=br;x+=6)ctx.lineTo(x,b.cy+b.h/2+wv(x));ctx.closePath();ctx.fill();ctx.strokeStyle='#d9c49a';ctx.lineWidth=Math.max(px,1.5*K);ctx.stroke();
      ctx.fillStyle='#e8604c';ctx.fillRect(bl,b.cy-b.h/2+wv(bl),Math.max(px,6*K),b.h);
      R(hx-46*K,hy-3*K,30*K,4.5*K,'#c94c3a');R(hx-49*K,hy-11*K,6*K,12*K,'#c94c3a');
      ctx.strokeStyle='#3b2a2a';ctx.lineWidth=Math.max(px,1.6*K);const tr=Math.cos(t*40)*6*K;ctx.beginPath();ctx.moveTo(hx-46*K,hy-5*K-tr);ctx.lineTo(hx-46*K,hy-5*K+tr);ctx.stroke();
      ctx.fillStyle='#e8604c';ctx.beginPath();ctx.roundRect(hx-18*K,hy-10*K,36*K,20*K,10*K);ctx.fill();
      ctx.fillStyle='#bfe3f5';ctx.beginPath();ctx.roundRect(hx+3*K,hy-7*K,13*K,9*K,4*K);ctx.fill();ctx.fillStyle='#ffffff';ctx.fillRect(hx+5*K,hy-6*K,Math.max(px,3*K),Math.max(px,2*K));
      R(hx-10*K,hy+9*K,2.5*K,5*K,'#3b2a2a');R(hx+7*K,hy+9*K,2.5*K,5*K,'#3b2a2a');R(hx-16*K,hy+13*K,32*K,2.5*K,'#3b2a2a');
      R(hx-1.5*K,hy-15*K,3*K,6*K,'#3b2a2a');ctx.fillStyle='rgba(59,42,42,0.15)';ctx.beginPath();ctx.ellipse(hx,hy-15*K,32*K,2.5*K,0,0,Math.PI*2);ctx.fill();const bl2=32*K*Math.abs(Math.cos(t*26));R(hx-bl2,hy-16*K,bl2*2,Math.max(px,2.4*K),'#3b2a2a');
      if(night&&Math.floor(t*2)%2)R(hx+15*K,hy-1*K,Math.max(px,3*K),Math.max(px,3*K),'#ff5a4a');}
  }
  if(act==='kite')drawKite(ctx,W,+f.hx,+f.hy,k,t,px);
  if(mood==='cold'){const mx=+f.mx,my=+f.my;for(let i=0;i<3;i++){const age=(t/1.8+i/3)%1;if(age>0.85)continue;ctx.fillStyle='rgba(255,255,255,'+((1-age)*0.75)+')';ctx.beginPath();circ(mx+age*26*k+6*k,my-age*10*k,(2+age*9)*k);ctx.fill();}}
  if(mood==='hot'){const hx=+f.headx,hy=+f.heady;for(let i=0;i<9;i++){const ph=(t*0.8+i/9)%1;const side=i%2?1:-1;const x=hx+side*(7.5+rnd(i)*2)*s+side*ph*6*s*(rnd(i+3)>0.5?1:0),y=hy-4*s+rnd(i*7)*8*s+ph*ph*14*s;const r=(1.2+rnd(i*3)*0.8)*s*0.9;ctx.globalAlpha=1-ph;ctx.fillStyle='#8fd0f6';ctx.beginPath();ctx.moveTo(x,y-r*2.2);ctx.quadraticCurveTo(x+r,y-r*0.3,x,y+r);ctx.quadraticCurveTo(x-r,y-r*0.3,x,y-r*2.2);ctx.fill();ctx.fillStyle='#e8f7ff';ctx.fillRect(x-r*0.4,y-r*0.6,Math.max(px,r*0.4),Math.max(px,r*0.4));}ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(232,96,60,0.55)';ctx.lineWidth=Math.max(px*0.8,1.5*k);for(let j=-1;j<=1;j++){ctx.beginPath();for(let q=0;q<=12;q++){const yy=hy-12*s-q*1.3*s-((t*20*k)%(4*s));const xx=hx+j*6*s+Math.sin(q*0.9+t*5+j)*1.5*s;q?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();}}
}

const PRESETS={
  worst:{noTune:1,name:'Worst day ever',icon:'blizzard',cond:'snow',fxk:'blizzard',temp:4,feels:-31,wind:52,dir:350,gust:74,lo:-6,hi:6,clouds:100,score:1,label:'Unlivable',start:15,curve:[1,1,1,1,1,1,1,2,2,2,2,2],act:'stand',pose:'stand',mood:'cold',outfit:{top:'sweater',outer:'coat',bottom:'pants',acc:['beanie','scarf']}},
  front:{name:'Cold front',icon:'overcast',cond:'overcast',precip:'none',temp:72,feels:72,wind:18,dir:320,gust:34,lo:33,hi:74,clouds:70,score:84,label:'Whiplash',start:12,curve:[84,86,82,68,46,28,20,17,16,15,15,14],act:'stand',pose:'stand',mood:'meh',outfit:{top:'tee',outer:'rain',bottom:'pants',acc:['umbrella','beanie']}},
  picnic:{name:'Sunny',cond:'sunny',temp:74,feels:75,wind:5,dir:315,gust:9,lo:61,hi:79,clouds:8,score:94,label:'Perfect',start:11,curve:[94,95,96,95,93,90,86,82,79,76,74,72],act:'picnic',pose:'sit',mood:'happy'},
  sunset:{name:'Dusk',cond:'sunset',temp:68,feels:67,wind:4,dir:270,gust:7,lo:58,hi:74,clouds:20,score:90,label:'Golden',start:18,curve:[90,91,89,86,83,80,78,76,75,74,73,74],act:'sunset',pose:'sit',mood:'content'},
  kite:{name:'Breezy',cond:'partly',temp:66,feels:64,wind:14,dir:250,gust:22,lo:55,hi:69,clouds:40,score:84,label:'Breezy',start:10,curve:[84,86,88,89,87,84,80,76,72,68,65,62],act:'kite',pose:'kite',mood:'happy'},
  overcast:{name:'Overcast',cond:'overcast',temp:52,feels:48,wind:10,dir:200,gust:16,lo:47,hi:55,clouds:95,score:58,label:'Brisk',start:10,curve:[58,60,63,66,68,67,64,60,56,53,50,48],act:'stand',pose:'stand',mood:'meh'},
  rain:{name:'Rainy',cond:'rain',temp:47,feels:41,wind:15,dir:180,gust:26,lo:44,hi:50,clouds:100,score:34,label:'Raw',start:10,curve:[34,31,30,33,38,45,52,55,50,46,42,40],act:'stand',pose:'stand',mood:'grumpy'},
  freezing:{name:'Snowy',cond:'snow',temp:27,feels:19,wind:12,dir:0,gust:20,lo:15,hi:26,clouds:85,score:16,label:'Frigid',start:9,curve:[16,18,22,26,29,30,28,24,20,17,15,14],act:'stand',pose:'stand',mood:'cold'},
  heat:{name:'Heat wave',cond:'heat',temp:97,feels:104,wind:2,dir:90,gust:5,lo:78,hi:101,clouds:0,score:22,label:'Scorching',start:12,curve:[22,18,15,14,16,22,30,38,46,52,55,57],act:'stand',pose:'stand',mood:'hot'},
  stargaze:{name:'Clear night',cond:'night',temp:66,feels:66,wind:3,dir:300,gust:6,lo:55,hi:72,clouds:5,score:88,label:'Serene',start:21,curve:[88,87,86,85,83,82,80,79,78,80,83,86],act:'stargaze',pose:'sit',mood:'content'},
  fog:{name:'Foggy',icon:'fog',cond:'overcast',temp:55,feels:53,wind:3,dir:240,gust:6,lo:50,hi:61,clouds:100,score:63,label:'Hushed',start:8,curve:[63,65,68,72,75,77,78,76,73,70,67,64],act:'stand',pose:'stand',mood:'meh'},
  drizzle:{name:'Drizzle',icon:'drizzle',cond:'overcast',precip:'drizzle',temp:54,feels:51,wind:6,dir:210,gust:11,lo:49,hi:57,clouds:96,score:52,label:'Damp',start:9,curve:[52,50,49,51,54,57,59,58,55,53,51,50],act:'stand',pose:'stand',mood:'meh'},
  storm:{name:'Thunderstorm',icon:'storm',cond:'rain',storm:1,temp:72,feels:75,wind:18,dir:230,gust:35,lo:66,hi:79,clouds:100,score:26,label:'Stormy',start:15,curve:[26,22,20,24,33,45,56,63,66,67,66,64],act:'stand',pose:'stand',mood:'grumpy'},
  gusty:{name:'Windy',icon:'gust',cond:'partly',temp:58,feels:50,wind:28,dir:290,gust:41,lo:51,hi:61,clouds:50,score:38,label:'Blustery',start:11,curve:[38,35,33,36,42,48,55,60,62,63,64,62],act:'stand',pose:'stand',mood:'grumpy'},
  sleet:{name:'Sleet',icon:'sleet',cond:'snow',precip:'sleet',temp:34,feels:26,wind:12,dir:20,gust:20,lo:31,hi:36,clouds:100,score:18,label:'Slushy',start:7,curve:[18,17,19,22,25,27,26,23,20,18,17,16],act:'stand',pose:'stand',mood:'grumpy'},
  blizzard:{name:'Blizzard',icon:'blizzard',cond:'snow',fxk:'blizzard',temp:18,feels:2,wind:35,dir:350,gust:50,lo:12,hi:20,clouds:100,score:6,label:'Brutal',start:14,curve:[6,5,5,6,8,10,11,12,13,14,15,15],act:'stand',pose:'stand',mood:'cold'},
  hail:{name:'Hail',icon:'hail',cond:'rain',precip:'hail',temp:61,feels:58,wind:16,dir:250,gust:30,lo:55,hi:66,clouds:100,score:20,label:'Pelting',start:16,curve:[20,18,24,35,48,58,63,64,62,60,58,57],act:'stand',pose:'stand',mood:'grumpy'},
  haze:{name:'Smoky',icon:'haze',cond:'heat',fxk:'haze',temp:84,feels:85,wind:4,dir:120,gust:8,lo:68,hi:88,clouds:10,score:24,label:'Hazy',start:11,curve:[24,22,20,20,22,25,29,33,36,38,40,41],act:'stand',pose:'stand',mood:'meh'},
  humid:{name:'Humid',icon:'humid',cond:'partly',temp:86,feels:97,wind:3,dir:160,gust:7,lo:78,hi:90,clouds:45,score:34,label:'Sticky',start:13,curve:[34,31,29,30,34,40,47,53,57,59,60,59],act:'stand',pose:'stand',mood:'hot'},
  bitter:{name:'Bitter cold',icon:'cold',cond:'snow',precip:'none',temp:8,feels:-4,wind:8,dir:340,gust:14,lo:1,hi:12,clouds:12,score:12,label:'Biting',start:8,curve:[12,13,16,20,24,26,25,22,18,15,13,12],act:'stand',pose:'stand',mood:'cold'},
};
const PORDER=['picnic','kite','overcast','fog','drizzle','rain','storm','hail','gusty','freezing','sleet','blizzard','bitter','heat','humid','haze','sunset','stargaze'];const PKEYS=PORDER.filter(k=>PRESETS[k]);
const CONDNAME={sunny:'Sunny',partly:'Partly cloudy',sunset:'Clear evening',heat:'Hot and hazy',overcast:'Overcast',rain:'Rain',snow:'Snow',night:'Clear night'};
const CLOUDPCT={sunny:6,partly:42,overcast:92,rain:100};
const HIST=[['sunny',81,5,4,'J'],['sunny',84,4,3,'W'],['partly',78,8,5,'J'],['partly',76,11,5,'J'],['overcast',70,7,4,'J'],['rain',64,12,2,'J'],['rain',61,14,1,'C'],['partly',68,9,4,'J'],['sunny',75,6,5,'J'],['sunny',79,3,5,'J'],['overcast',66,5,3,'J'],['partly',71,13,4,'J'],['rain',58,16,2,'C'],['overcast',60,10,3,'C'],['sunny',73,7,5,'J'],['partly',69,12,4,'J'],['sunny',72,5,5,'J'],['overcast',62,8,3,'J'],['rain',57,11,2,'J'],['rain',55,18,1,'C'],['partly',63,9,4,'J'],['sunny',67,6,4,'J'],['overcast',59,12,3,'C'],['partly',64,14,3,'J'],['sunny',70,4,5,'J'],['partly',66,10,4,'J']]
  .map(([cond,temp,wind,rating,fit],i)=>({day:i+1,cond,temp,wind,rating:rating-1,fit:{J:'Just right',C:'Too cold',W:'Too warm'}[fit],clouds:Math.min(100,CLOUDPCT[cond]+Math.round(rnd(i)*8)),feels:temp-(wind>=12?4:wind>=8?2:0)+(temp>=80?3:0)}));
const PAIRS=[
  [['sunny',82,5,10],['partly',66,14,40]],[['overcast',58,4,90],['sunny',90,3,0]],[['rain',62,6,100],['partly',48,18,30]],[['snow',30,2,80],['overcast',40,16,95]],
  [['sunny',72,16,5],['partly',76,2,50]],[['partly',55,3,35],['overcast',65,9,100]],[['heat',95,4,0],['rain',70,5,100]],[['partly',35,12,40],['sunny',42,2,0]]];
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MOODR=['grumpy','grumpy','meh','content','happy'];
const LS='balmy-preset',LSO='balmy-onboarded';
const COMPASS=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
const REL=[['Much worse','−−',-20],['Worse','−',-8],['Spot on','=',0],['Better','+',8],['Much better','++',18]];

// ---- loading world: snug potters about in the scene while the forecast loads, then it grows out of the hills ----
const LOAD_FIT={top:'tee',outer:'none',bottom:'pants',acc:[]};
const LOAD_CURVE=[56,59,63,61,57,54,56,60,62,59,55,53],LOAD_BU=0.06+LOAD_CURVE.indexOf(Math.max(...LOAD_CURVE))*0.08;
const LD_WORDS={base:['sniffing the breeze','counting clouds','asking the pigeons','reading the sky','weighing the wind','tasting the air','picking your socks','folding a jacket','consulting a squirrel','peeking over the skyline','asking the gondola folks','checking twice'],
  rain:['counting raindrops','testing puddles','finding the umbrella'],snow:['catching snowflakes','measuring the drifts','warming the mittens'],
  sunny:['polishing the sun','finding the sunglasses'],heat:['finding some shade','fanning the sun'],night:['counting stars','asking the moon'],overcast:['poking the clouds','looking for blue sky']};
const cl01=x=>Math.max(0,Math.min(1,x)),lerp=(a,b,t)=>a+(b-a)*t,eio=x=>x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2,eo=x=>1-Math.pow(1-x,3),eob=x=>{const c=1.70158;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2);};
function ldWords(g){const c=g.cond,k=c.split('@')[0],extra=LD_WORDS[g.night?'night':k==='partly'||k==='sunset'?'sunny':k]||[];const out=[],b=LD_WORDS.base;
  for(let i=0;i<b.length;i++){out.push(b[i]);if(extra[i])out.push(extra[i]);if(i===2)out.push('sniffing around '+g.city);}return out;}
// Little things snug does while loading. Each bit stays near one spot; a short stroll links them.
// Order is shuffled per visit, and the rare ones (ufo, dance) only sometimes make the list.
const LD_BITS={skycheck:3.4,kite:5,dandelion:4.2,nap:4.6,pigeon:5.2,butterfly:4.8,puddle:3.2,snowflake:3.6,stars:4.4,ufo:5.6,dance:4};
function ldPlan(g){const wet=g.precipK==='rain'||g.precipK==='drizzle',snowy=g.precipK==='snow',stormy=/storm/.test(g.sceneKey),rnd0=Math.random;
  let pool=['skycheck','nap','butterfly','pigeon'];
  if(!wet&&!snowy)pool.push('dandelion');if(!wet&&!snowy&&!stormy&&g.wind>=4)pool.push('kite');
  if(wet)pool.push('puddle','puddle');if(snowy)pool.push('snowflake','snowflake');if(g.night&&!wet&&!snowy)pool.push('stars','stars');
  pool=pool.map(v=>[rnd0(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]);
  const egg=rnd0();if(egg<0.14)pool.unshift('ufo');else if(egg<0.26)pool.unshift('dance');
  // ?bit=kite (or any key of LD_BITS) plays that one first, for trying them out
  const force=typeof location!=='undefined'?new URLSearchParams(location.search).get('bit'):null;if(force&&LD_BITS[force])pool=[force,...pool.filter(k=>k!==force)];
  const half=g.aW*0.32,lo=half+6,hi=g.vw-half-6,spread=Math.min(g.vw*0.12,150);
  let x=g.aCx,t=0;const segs=[];
  pool.forEach((k,i)=>{if(i){const nx=Math.max(lo,Math.min(hi,g.aCx+(rnd0()*2-1)*spread));const d=Math.max(0.5,Math.abs(nx-x)/90);segs.push({k:'walk',a:x,b:nx,t0:t,d});t+=d;x=nx;}
    segs.push({k,a:x,t0:t,d:LD_BITS[k]});t+=LD_BITS[k];});
  const back=Math.max(0.5,Math.abs(g.aCx-x)/90);segs.push({k:'walk',a:x,b:g.aCx,t0:t,d:back});t+=back;
  return {segs,T:t};}
// where snug is and what he's doing at time u of the plan
function ldKid(plan,u,aS){const s=plan.segs.find(x=>u<x.t0+x.d)||plan.segs[plan.segs.length-1],p=cl01((u-s.t0)/s.d),lt=u-s.t0;
  const o={x:s.a,y:0,lean:0,pose:'stand',s,p,lt};
  if(s.k==='walk'){o.x=lerp(s.a,s.b,eio(p));o.y=-Math.abs(Math.sin(lt*2.4*Math.PI))*1.5*aS;o.lean=Math.sign(s.b-s.a)*3;}
  else if(s.k==='skycheck'){if(p>0.25&&p<0.75)o.pose='kite';else if(p>=0.8){const q=cl01((p-0.8)/0.18);o.y=-4*q*(1-q)*6*aS;}}
  else if(s.k==='kite')o.pose='kite';
  else if(s.k==='dandelion'||s.k==='nap'||s.k==='butterfly'||s.k==='stars')o.pose=p>0.06&&p<0.94?'sit':'stand';
  else if(s.k==='pigeon'){if(p>0.62&&p<0.74){const q=(p-0.62)/0.12;o.y=-4*q*(1-q)*8*aS;}}
  else if(s.k==='puddle'){if(p>0.2&&p<0.55){const q=(p-0.2)/0.35;o.y=-4*q*(1-q)*18*aS;}}
  else if(s.k==='snowflake'){if(p>0.3&&p<0.8)o.pose='kite';}
  else if(s.k==='ufo'){if(p>0.42&&p<0.72)o.y=-Math.sin((p-0.42)/0.3*Math.PI)*16*aS;}
  else if(s.k==='dance'){const b=Math.floor(lt*3);o.lean=(b%2?-1:1)*8;o.y=-Math.abs(Math.sin(lt*3*Math.PI))*4*aS;if(b%4===3)o.pose='kite';}
  return o;}
function ldPuff(list,kind,x,y,n,dir){for(let i=0;i<n;i++){const a=Math.random();
  if(kind==='star'){const an=i/n*Math.PI*2+Math.random()*0.3,sp=160+Math.random()*160;list.push({kind,x,y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-60,g:260,life:0.7+a*0.3,max:1,r:3+Math.random()*3,c:i%3?'#fff6c8':'#f2c230'});}
  else if(kind==='cloud'){const an=i/n*Math.PI*2;list.push({kind,x:x+Math.cos(an)*30,y:y+Math.sin(an)*44,vx:Math.cos(an)*70,vy:Math.sin(an)*50-20,g:0,life:0.55+a*0.2,max:0.75,r:16+Math.random()*14,c:'#ffffff'});}
  else if(kind==='seed'){list.push({kind,x,y,vx:(dir||1)*(40+a*70),vy:-(15+Math.random()*35),g:-4,life:2.6+a,max:3.4,r:2.2,c:'#ffffff',w:Math.random()*6});}
  else{const splash=kind==='rain',snow=kind==='snow';list.push({kind,x:x+(Math.random()-0.5)*14,y,vx:(-dir*(30+Math.random()*50))+(Math.random()-0.5)*40,vy:-(splash?120+Math.random()*120:20+Math.random()*40),g:splash?520:snow?40:30,life:splash?0.45:0.6+a*0.3,max:splash?0.45:0.9,r:splash?2+a*1.5:snow?4+a*4:5+a*5,c:splash?'#b8dcf5':snow?'#ffffff':'#d9c29a'});}}}
function ldBfly(ctx,x,y,s,t,perched,night,a){ctx.save();ctx.globalAlpha=a;
  if(night){const gl=ctx.createRadialGradient(x,y,0,x,y,9*s);gl.addColorStop(0,'rgba(255,236,140,'+(0.55+0.35*Math.sin(t*5))+')');gl.addColorStop(1,'rgba(255,236,140,0)');ctx.fillStyle=gl;ctx.fillRect(x-9*s,y-9*s,18*s,18*s);ctx.fillStyle='#fff6c0';ctx.fillRect(x-s,y-s,2*s,2*s);ctx.restore();return;}
  const w=perched?0.55+0.45*Math.abs(Math.sin(t*2.2)):0.15+0.85*Math.abs(Math.sin(t*15));
  [[-1],[1]].forEach(([d])=>{ctx.fillStyle='#f2a33a';ctx.fillRect(d<0?x-5*s*w:x,y-4*s,5*s*w,3.6*s);ctx.fillStyle='#e8604c';ctx.fillRect(d<0?x-3.5*s*w:x,y-0.4*s,3.5*s*w,2.6*s);ctx.fillStyle='#fff6e0';ctx.fillRect(x+d*3.2*s*w-(d<0?s*0.9:0),y-3*s,s*0.9*w,s*0.9);});
  ctx.fillStyle='#2e1a0c';ctx.fillRect(x-0.6*s,y-3.8*s,1.2*s,6*s);ctx.fillRect(x-1.6*s,y-5.4*s,0.8*s,1.6*s);ctx.fillRect(x+0.8*s,y-5.4*s,0.8*s,1.6*s);ctx.restore();}
// a small grey city pigeon; mode walk | peck | fly
function ldPigeon(ctx,x,y,s,t,mode,dir){ctx.save();ctx.translate(x,y);ctx.scale(dir,1);const R=(a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(a*s,b*s,w*s,h*s);};
  const peck=mode==='peck'&&Math.sin(t*9)>0,fly=mode==='fly',hb=mode==='walk'?(Math.floor(t*6)%2):0;
  if(!fly){R(-1,-1,1,1,'#d0703a');R(1,-1,1,1,'#d0703a');}
  R(-4,-6,8,5,'#8e93a3');R(-5,-5,2,3,'#6f7485');R(-6,-4,2,2,'#5d6272');
  R(-2,-6,5,1,'#a8adbb');
  if(fly){const f=Math.sin(t*22)>0;R(-2,f?-11:-6,4,f?5:3,'#7a8091');}else R(-2,-5,4,2,'#7a8091');
  const hx=peck?4:3,hy=peck?-3:-9+hb*0.5;R(hx-1,hy,3,3,'#6d7384');R(hx-1,hy+2.6,3,1,'#5aa38a');R(hx+2,hy+1,1.4,1,'#e0a24a');R(hx+0.6,hy+0.6,0.8,0.8,'#1c1a28');
  ctx.restore();}
function ldUfo(ctx,x,y,s,t,beam){ctx.save();if(beam>0){const g=ctx.createLinearGradient(0,y,0,y+beam);g.addColorStop(0,'rgba(190,255,190,0.55)');g.addColorStop(1,'rgba(190,255,190,0.08)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-6*s,y+2*s);ctx.lineTo(x+6*s,y+2*s);ctx.lineTo(x+16*s,y+beam);ctx.lineTo(x-16*s,y+beam);ctx.closePath();ctx.fill();}
  ctx.fillStyle='#bfe8ff';ctx.beginPath();ctx.ellipse(x,y-2*s,5*s,4*s,0,Math.PI,0);ctx.fill();
  ctx.fillStyle='#8d93a6';ctx.beginPath();ctx.ellipse(x,y,14*s,3.6*s,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b9bfcf';ctx.fillRect(x-14*s,y-0.6*s,28*s,1.2*s);
  for(let i=0;i<5;i++){ctx.fillStyle=Math.floor(t*6+i)%2?'#f2c230':'#e8604c';ctx.fillRect(x+(i-2)*5*s-s,y+1.2*s,2*s,1.4*s);}ctx.restore();}
function ldText(ctx,txt,x,y,fs,a){ctx.save();ctx.globalAlpha=a;ctx.font="800 "+fs+"px 'Rethink Sans',sans-serif";ctx.textAlign='center';ctx.lineJoin='round';ctx.strokeStyle='rgba(12,10,18,0.5)';ctx.lineWidth=fs*0.18;ctx.strokeText(txt,x,y);ctx.fillStyle='#ffffff';ctx.fillText(txt,x,y);ctx.restore();}
// "loading…" and one line of what snug is up to, sitting just above the hills
function ldSky(ctx,g,t,fade,lift){const m=g.m,fs=m?40:58,ty=Math.round(Math.max(m?150:140,g.groundY-g.hsR-(m?78:70)))-lift;
  ctx.save();ctx.globalAlpha=fade;ctx.textBaseline='alphabetic';ctx.lineJoin='round';ctx.font="800 "+fs+"px 'Rethink Sans',sans-serif";
  const title='loading',dots=Math.floor(t*2.4)%4,ws=[...title].map(ch=>ctx.measureText(ch).width),dw=ctx.measureText('.').width,sp=fs*0.03,tw=ws.reduce((a,b)=>a+b+sp,0)+dw*3;let x=g.vw/2-tw/2;
  const glyph=(ch,x,y)=>{ctx.strokeStyle='rgba(12,10,18,0.55)';ctx.lineWidth=fs*0.13;ctx.strokeText(ch,x,y);ctx.fillStyle='#ffffff';ctx.fillText(ch,x,y);};
  [...title].forEach((ch,i)=>{glyph(ch,x,ty-Math.abs(Math.sin(t*3.2-i*0.45))*fs*0.13);x+=ws[i]+sp;});for(let i=0;i<3;i++){if(i<dots)glyph('.',x,ty);x+=dw;}
  const words=ldWords(g),P=2.4,k=Math.floor(t/P),ph=(t%P)/P,a=Math.min(1,ph/0.12,(1-ph)/0.12),dy=(1-Math.min(1,ph/0.12))*8,line=words[k%words.length]+'…',fy=ty+(m?19:24)+dy;
  ctx.globalAlpha=fade*a;ctx.font="700 "+(m?16:19)+"px 'Rethink Sans',sans-serif";ctx.textAlign='center';ctx.strokeStyle='rgba(12,10,18,0.5)';ctx.lineWidth=4.5;ctx.strokeText(line,g.vw/2,fy);ctx.fillStyle='#ffffff';ctx.fillText(line,g.vw/2,fy);
  ctx.restore();}

class Component extends DCLogic {
  rootRef=React.createRef();sliderRef=React.createRef();dressRef=React.createRef();
  state={picks:(()=>{try{return JSON.parse(localStorage.getItem('snug-picks')||'[]');}catch(e){return [];}})(),lgStep:0,cityText:'',profile:(()=>{try{return JSON.parse(localStorage.getItem('snug-profile')||'null')||{city:'',runs:'',times:[],acts:[]};}catch(e){return {city:'',runs:'',times:[],acts:[]};}})(),authed:(()=>{try{return localStorage.getItem('snug-auth')==='1';}catch(e){return false;}})(),night:(()=>{try{return localStorage.getItem('snug-night')==='1';}catch(e){return false;}})(),season:(()=>{try{return localStorage.getItem('snug-season')||'auto';}catch(e){return 'auto';}})(),dressStep:99,preset:(()=>{try{const v=localStorage.getItem(LS);if(PRESETS[v])return v;}catch(e){}return this.props.preset??'picnic';})(),
    onboarded:(()=>{try{return localStorage.getItem(LSO)==='1';}catch(e){return false;}})(),
    units:this.props.units??'°F',motion:this.props.motion??true,rateOpen:false,hourSel:null,felt:null,rateFit:null,saved:false,obStep:0,obPick:null,histSel:26,vw:0,vh:0,active:'today'};
  win(){const el=this.rootRef.current;return (el&&el.ownerDocument.defaultView)||window;}
  paint(){
    const t=this.state.motion?performance.now()/1000:0,root=this.rootRef.current;if(!root)return;
    root.querySelectorAll('canvas[data-scene],canvas[data-fxl],canvas[data-sgl],canvas[data-skyn],canvas[data-meadow],canvas[data-ptext]').forEach(cv=>{const p=cv.parentElement;if(!p)return;const W=p.clientWidth,H=p.clientHeight;if(!W||!H)return;
      const px=+cv.dataset.px||2;const bw=Math.ceil(W/px),bh=Math.ceil(H/px);
      if(cv.width!==bw||cv.height!==bh){cv.width=bw;cv.height=bh;cv.style.width=bw*px+'px';cv.style.height=bh*px+'px';}
      const ctx=cv.getContext('2d');ctx.setTransform(1/px,0,0,1/px,0,0);
      try{if(cv.dataset.curvetext){ctx.clearRect(0,0,W,H);const f=cv.dataset,sag=+f.sag||30,str=f.b||'',Y=x=>6+sag*4*(x/W)*(1-x/W);ctx.font="800 18px 'Rethink Sans',sans-serif";try{ctx.letterSpacing='1px';}catch(e){}const tw=ctx.measureText(str).width;let x=(W-tw)/2;ctx.textAlign='center';ctx.textBaseline='alphabetic';for(const ch of str){const w=ctx.measureText(ch).width,cx=x+w/2,a=Math.atan2(Y(cx+4)-Y(cx-4),8);ctx.save();ctx.translate(cx,Y(cx)-8);ctx.rotate(a);ctx.lineJoin='round';ctx.strokeStyle='#4a2e16';ctx.lineWidth=4;ctx.strokeText(ch,0,0);ctx.fillStyle='#4a2e16';ctx.fillText(ch,2,2);ctx.fillStyle='#fff1d2';ctx.fillText(ch,0,0);ctx.restore();x+=w;}try{ctx.letterSpacing='0px';}catch(e){}}
      else if(cv.dataset.ptext){ctx.clearRect(0,0,W,H);const f=cv.dataset,fb=+f.fb||30,cx=W/2,ink='#fff1d2',sh='#4a2e16';ctx.textAlign='center';ctx.textBaseline='top';const wrap=(str,font,maxW)=>{ctx.font=font;const ws=str.split(' '),out=[];let cur='';ws.forEach(w=>{const t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=w;}else cur=t;});if(cur)out.push(cur);return out;};
          const draw=(str,y,font)=>{ctx.font=font;ctx.fillStyle=sh;ctx.fillText(str,cx+2,y+2);ctx.fillStyle=ink;ctx.fillText(str,cx,y);};let y=2;
          if(f.a){const fa="800 12px 'Rethink Sans',sans-serif";try{ctx.letterSpacing='2px';}catch(e){}draw(f.a,y,fa);try{ctx.letterSpacing='0px';}catch(e){}y+=20;}
          const fbF='800 '+fb+"px 'Rethink Sans',sans-serif";wrap(f.b,fbF,W-8).forEach(l=>{draw(l,y,fbF);y+=fb*(fb>40?0.86:1.08);});
          if(f.c){y+=fb>40?4:4;const fc="700 14px 'Rethink Sans',sans-serif";wrap(f.c,fc,W-8).forEach(l=>{draw(l,y,fc);y+=18;});}}
      else if(cv.dataset.meadow){drawMeadow(ctx,W,H,cv.dataset.cond,t,+cv.dataset.wind||0,cv.dataset.season||'',px,+cv.dataset.pl,+cv.dataset.pr,+cv.dataset.kx,+cv.dataset.ky,cv.dataset);}else if(cv.dataset.skyn&&cv.dataset.mode==='ridge'){ctx.clearRect(0,0,W,H);const f=cv.dataset,cvv=f.curve.split(',').map(Number),g=+f.g,hs=+f.hs,R=x=>ridgeY(x/W,cvv,g,hs,0),wc='rgba(255,255,255,0.97)',sh=f.shc;ctx.textAlign='center';ctx.textBaseline='alphabetic';
        const x0=+f.lx||W*0.045,big=f.part!=='small';ctx.font="800 150px 'Rethink Sans',sans-serif";const pc='rgba(58,50,66,0.85)';let x=textOnRidge(ctx,f.num,x0,R,18,6,'#fbfcff',null,0,pc,!big);
        ctx.font="700 34px 'Rethink Sans',sans-serif";const xl=textOnRidge(ctx,f.lab,x+20,R,16,4,'#fbfcff',null,0,pc,!big);
        ctx.font="800 20px 'Rethink Sans',sans-serif";if(big)textOnRidge(ctx,'COMFORT TODAY',x0+4,R,138,3,wc,sh,5);
        if(!big){ctx.font="700 17px 'Rethink Sans',sans-serif";textOnRidge(ctx,'comfort over the next 12 hours →',x0+10,R,-34,1,'#ffffff','rgba(30,40,60,0.6)',4);}
        if(!big){const hl=(f.hl||'').split(','),best=+f.best,sel=+f.sel,X=i=>W*(0.06+i*0.08),wood=['#9a6a3a','#744b27','#b98550'],t=performance.now()/1000;
          const stake=(x,txt,big)=>{ctx.font="800 "+(big?19:17)+"px 'Rethink Sans',sans-serif";const tw=ctx.measureText(txt).width,y=R(x),pw=tw+18,ph=big?30:27,top=y-(big?44:40);
            ctx.fillStyle=wood[1];ctx.fillRect(x-2,top+ph-2,4,y-top-ph+5);
            ctx.fillStyle='#5a3a1e';ctx.beginPath();ctx.roundRect(x-pw/2-2,top-2,pw+4,ph+4,5);ctx.fill();
            ctx.fillStyle=big?'#fff6d8':'#f6e8c6';ctx.beginPath();ctx.roundRect(x-pw/2,top,pw,ph,4);ctx.fill();
            ctx.fillStyle='rgba(120,80,40,0.18)';ctx.fillRect(x-pw/2,top+ph-4,pw,4);
            ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#2e1a0c';ctx.fillText(txt,x,top+ph/2);ctx.textBaseline='alphabetic';};
          [2,4,6,8,10].forEach(i=>{if(i===best||i===sel||X(i)<xl+30)return;stake(X(i),hl[i]);});
          if(sel!==best&&X(sel)>xl+20)stake(X(sel),hl[sel]+' · '+cvv[sel],true);
          if(X(best)>xl+12){const x=X(best),y=R(x)+2,ph=84,fw=124,fh=32,top=y-ph;ctx.fillStyle='#4a3a2a';ctx.fillRect(x-1.5,top,3,ph);ctx.fillStyle='#e8d9b8';ctx.beginPath();circ2(ctx,x,top-2,3.5);ctx.fill();
            const col=STRONG[band(cvv[best])];ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x+2,top+2);for(let q=0;q<=8;q++){const xx=x+2+q*fw/8,yy=top+2+Math.sin(q*0.8-t*4)*2.5*(q/8);ctx.lineTo(xx,yy);}for(let q=8;q>=0;q--){const xx=x+2+q*fw/8,yy=top+2+fh-(q/8)*6+Math.sin(q*0.8-t*4)*2.5*(q/8);ctx.lineTo(xx,yy);}ctx.closePath();ctx.fill();
            ctx.font="800 17px 'Rethink Sans',sans-serif";ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#ffffff';ctx.fillText('best · '+hl[best],x+10,top+2+fh/2-1+Math.sin(4*0.8-t*4)*1.2);ctx.textBaseline='alphabetic';}}}
      else if(cv.dataset.skyn){ctx.clearRect(0,0,W,H);const f=cv.dataset;if(f.part!=='small'){ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.font="800 26px 'Rethink Sans',sans-serif";try{ctx.letterSpacing='3px';}catch(e){}ctx.lineJoin='round';ctx.strokeStyle=f.capstroke;ctx.lineWidth=5;ctx.strokeText('COMFORT TODAY',W/2,+f.capy);ctx.fillStyle='#ffffff';ctx.fillText('COMFORT TODAY',W/2,+f.capy);try{ctx.letterSpacing='0px';}catch(e){}}if(f.part==='small')return;const al=f.al||'center',base=+f.base||240,x=al==='center'?W/2:+f.lx,nf=+f.nfs||150,lf=+f.lfs||30,wc='rgba(255,255,255,0.96)';
        ctx.textBaseline='alphabetic';ctx.textAlign=al;try{ctx.letterSpacing=(-nf*0.05)+'px';}catch(e){}ctx.font='800 '+nf+"px 'Rethink Sans',sans-serif";const nw=ctx.measureText(f.num).width;ctx.fillStyle=f.shc;ctx.fillText(f.num,x+3,base+5);ctx.lineJoin='round';ctx.strokeStyle='rgba(12,10,18,0.72)';ctx.lineWidth=6;ctx.strokeText(f.num,x,base);ctx.fillStyle=wc;ctx.fillText(f.num,x,base);try{ctx.letterSpacing='0px';}catch(e){}
        ctx.font='700 '+lf+"px 'Rethink Sans',sans-serif";let lx=x,ly=base+lf*1.25;if(f.lm==='right'){ctx.textAlign='left';lx=x+nw+14;ly=base-nf*0.72+lf*0.78;}ctx.fillStyle=f.shc;ctx.fillText(f.lab,lx+2,ly+2);ctx.strokeStyle='rgba(12,10,18,0.72)';ctx.lineWidth=4;ctx.strokeText(f.lab,lx,ly);ctx.fillStyle=wc;ctx.fillText(f.lab,lx,ly);}else if(cv.dataset.sgl)drawSigns(ctx,W,H,t,cv.dataset,px);else if(cv.dataset.fxl)drawFx(ctx,W,H,t,cv.dataset,px);
        else{const gp=cv.dataset.groundPx;const g=gp?+gp:Math.round(H*(+cv.dataset.ground||0.7));drawScene(ctx,W,H,cv.dataset.cond||'sunny',t,g,+cv.dataset.seed||0,+cv.dataset.wind||0,!!cv.dataset.tree,px,cv.dataset);}}catch(e){console.error(e);}});
    root.querySelectorAll('img[data-shiver]').forEach(el=>{if(this._phase!=='ready')return;const on=el.dataset.shiver==='1';el.style.transform=on&&this.state.motion?'translateX('+((Math.floor(t*16)%2?1:-1)*(this.state.vw<760?3:4))+'px)':'';});
    root.querySelectorAll('[data-swing]').forEach(el=>{const i=+el.dataset.swing,w=(PRESETS[this.state.preset]||{}).wind||5;el.style.transform=this.state.motion?'rotate('+(Math.sin(t*(1.4+i*0.07)+i*0.9)*Math.min(14,3+w*0.5)).toFixed(1)+'deg)':'';});
    {const wt=woodTex();if(wt)root.querySelectorAll('[data-woodtex]').forEach(el=>{if(el.dataset.wset!=='1'){el.style.backgroundImage='url('+wt+')';el.dataset.wset='1';}});}
    root.querySelectorAll('[data-sway]').forEach(el=>{if(this._phase!=='ready')return;const lo=el.dataset.sway==='lo';const w=+(this.state.preset&&PRESETS[this.state.preset]?PRESETS[this.state.preset].wind:5)||5;el.style.transform=this.state.motion?'rotate('+(Math.sin(t*(lo?0.9:1.3))*Math.min(3.5,0.6+w*0.14)*(lo?0.25:1)).toFixed(2)+'deg)':'';});
    root.querySelectorAll('[data-bob]').forEach(el=>{el.style.transform=this.state.motion?'translateY('+(Math.abs(Math.sin(t*2.2))*-5).toFixed(1)+'px)':'';});
    root.querySelectorAll('img[data-wobble]').forEach(el=>{const w=+el.dataset.wobble||0;el.style.transform=this.state.motion?'rotate('+(Math.sin(t*(1.5+w*0.1))*Math.min(14,2+w*0.8)).toFixed(1)+'deg)':'';});
    if((this._edgeN=(this._edgeN||0)+1)%15===1)try{this.syncEdges(root);}catch(e){}
  }
  // What shows past the top and bottom of the page when a phone rubber-bands: the sky's top row above (see the
  // snug-edge-top block in globals.css) and the ground below, as CSS variables, so the scene looks like it keeps going.
  syncEdges(root){
    const doc=root.ownerDocument,de=doc.documentElement,sy=doc.defaultView.scrollY,H=de.scrollHeight;
    const avg=(cv,y)=>{const ctx=cv.getContext('2d'),w=cv.width,d=ctx.getImageData(0,Math.max(0,Math.min(cv.height-1,y)),w,1).data;const px=[];for(let i=0;i<33;i++){const k=Math.floor((i+0.5)/33*w)*4;px.push([d[k],d[k+1],d[k+2]]);}px.sort((p,q)=>(p[0]+p[1]+p[2])-(q[0]+q[1]+q[2]));const m=px[16];return 'rgb('+m[0]+','+m[1]+','+m[2]+')';};  // the median, so a stray leaf or star doesn't tint it
    let top=null,bottom=null;
    root.querySelectorAll('canvas[data-scene]').forEach(cv=>{if(!cv.width)return;const r=cv.getBoundingClientRect(),y0=r.top+sy,y1=r.bottom+sy;
      if(!top&&y0<=1&&r.width>=doc.defaultView.innerWidth*0.9)top=avg(cv,0);
      if(!bottom&&y1>=H-1&&r.width>=doc.defaultView.innerWidth*0.9)bottom=avg(cv,cv.height-1);});
    const m=root.querySelector('canvas[data-meadow]');if(m&&m.width&&m.height)bottom=avg(m,m.height-2);
    if(top&&de.style.getPropertyValue('--snug-top')!==top)de.style.setProperty('--snug-top',top);
    if(bottom&&de.style.getPropertyValue('--snug-bottom')!==bottom)de.style.setProperty('--snug-bottom',bottom);
  }
  async askWeather(text){if(!text.trim()||this.state.asking)return;this.setState({asking:true,askErr:''});
    const cl=window.claude||(window.parent&&window.parent.claude)||(window.top&&window.top.claude);
    const E=(arr,d)=>({type:'string',enum:arr,description:d});
    const schema={type:'object',properties:{
      name:{type:'string',description:'2-3 word chip name for this scenario, lowercase, e.g. "foggy dawn"'},
      cond:E(['sunny','partly','sunset','heat','overcast','rain','snow','night'],'sky/scene look. heat = very hot or humid haze, sunset = dusk, night = after dark'),
      temp:{type:'integer',description:'air temp °F right now'},feels:{type:'integer',description:'feels-like °F right now'},
      lo:{type:'integer',description:'today low °F'},hi:{type:'integer',description:'today high °F'},
      wind:{type:'integer',description:'sustained wind mph'},gust:{type:'integer',description:'gust mph'},dir:{type:'integer',description:'direction wind comes from, degrees 0-359'},
      clouds:{type:'integer',description:'cloud cover percent 0-100'},
      score:{type:'integer',description:'1-100, how comfortable being outside feels right now for a typical person'},
      label:{type:'string',description:'one or two lowercase words for how it feels, e.g. crisp, sticky, raw, perfect, hushed'},
      start:{type:'integer',description:'current hour 0-23 implied by the description'},
      curve:{type:'array',items:{type:'integer'},minItems:12,maxItems:12,description:'comfort score for each of the next 12 hours starting now; first value equals score; reflect how conditions change through the day'},
      act:E(['stand','picnic','kite','sunset','stargaze'],'what the kid is doing: picnic on lovely days, kite when breezy and nice, sunset at pleasant dusk, stargaze on clear pleasant nights, otherwise stand'),
      mood:E(['happy','content','meh','grumpy','cold','hot'],'kid facial expression; cold = freezing and miserable, hot = overheating and miserable'),
      top:E(['tank','tee','long','sweater'],'base layer'),outer:E(['none','light','hoodie','coat','rain'],'outer layer, rain = rain jacket'),bottom:E(['shorts','pants'],'bottoms'),
      acc:{type:'array',items:E(['sunglasses','umbrella','beanie','scarf'],'accessory'),description:'accessories worth bringing'},
      precip:E(['none','drizzle','rain','snow'],'what is falling from the sky right now, independent of cond')},
      required:['name','precip','cond','temp','feels','lo','hi','wind','gust','dir','clouds','score','label','start','curve','act','mood','top','outer','bottom','acc']};
    let got=null;
    const call=model=>cl.complete({model,max_tokens:1200,system:'You are the forecasting brain of a weather comfort app. Read the user\'s plain-language weather description, imagine the full day it implies, and call set_weather once with realistic, internally consistent numbers and a sensible outfit. Infer anything not stated.',
      messages:[{role:'user',content:text}],tools:[{name:'set_weather',description:'Send the interpreted weather to the app.',input_schema:schema,run:async inp=>{got=inp;return 'shown';}}],tool_choice:{type:'tool',name:'set_weather'}});
    try{if(!cl)throw new Error('no claude');try{await call('claude-sonnet-4-5');}catch(e){if(!got)await call(undefined);}
      if(!got)throw new Error('no tool call');const j=got,I=(v,d)=>Number.isFinite(+v)?Math.round(+v):d;
      const score=Math.max(1,Math.min(100,I(j.score,60)));let curve=(j.curve||[]).map(v=>Math.max(1,Math.min(100,I(v,score))));while(curve.length<12)curve.push(curve[curve.length-1]??score);curve=curve.slice(0,12);
      const act=j.act||'stand',pose=act==='picnic'||act==='sunset'||act==='stargaze'?'sit':act==='kite'?'kite':'stand',lab=String(j.label||'custom').toLowerCase();
      const P={name:String(j.name||text).slice(0,22),cond:j.cond||'partly',temp:I(j.temp,60),feels:I(j.feels,60),lo:I(j.lo,55),hi:I(j.hi,65),wind:Math.max(0,I(j.wind,5)),gust:Math.max(0,I(j.gust,8)),dir:((I(j.dir,270)%360)+360)%360,clouds:Math.max(0,Math.min(100,I(j.clouds,40))),score,label:lab.charAt(0).toUpperCase()+lab.slice(1),start:((I(j.start,10)%24)+24)%24,curve,act,pose,mood:j.mood||'content',
        precip:j.precip&&j.precip!=='none'?j.precip:'',outfit:{top:j.top||'tee',outer:j.outer||'none',bottom:j.bottom||'pants',acc:Array.isArray(j.acc)?j.acc:[]},custom:true};
      PRESETS.custom=P;try{localStorage.setItem('snug-custom',JSON.stringify(P));}catch(e){}this.setState({asking:false,askText:''});this.setPreset('custom');
    }catch(e){console.error(e);this.setState({asking:false,askErr:'couldn’t read that'});}}
  revealDress(){const root=this.rootRef.current;this._dressing=false;clearTimeout(this._dt);clearTimeout(this._wd);if(root){root.querySelectorAll('[data-piece]').forEach(t=>{t.style.transition='none';t.style.opacity='1';t.style.transform='none';t.style.zIndex='';t.style.background='';t.style.clipPath='';const c=t.firstElementChild;if(c){c.style.background='';c.style.clipPath='';}const im=t.querySelector('img');if(im)im.style.filter='';});root.querySelectorAll('[data-plabel]').forEach(l=>{l.style.transition='none';l.style.opacity='1';});}if(this.state.dressStep!==99)this.setState({dressStep:99});}
  startDress(){clearTimeout(this._dt);clearTimeout(this._wd);clearInterval(this._dv);const root=this.rootRef.current;const pan=root&&root.querySelector('[data-dresspanel]');if(!root||!pan){this.revealDress();return;}const tiles=[...root.querySelectorAll('[data-piece]')],labs=[...root.querySelectorAll('[data-plabel]')];this._dressing=true;this._wd=setTimeout(()=>this.revealDress(),1200+tiles.length*1150);
    tiles.forEach(t=>{t.style.transition='none';t.style.opacity='0';t.style.transform='scale(0.3)';t.style.zIndex='';t.style.background='';t.style.clipPath='';const c=t.firstElementChild;if(c){c.style.background='';c.style.clipPath='';}});labs.forEach(l=>{l.style.transition='none';l.style.opacity='0';});
    this.setState({dressStep:0});
    const step=k=>{const tl=[...root.querySelectorAll('[data-piece]')],lb=[...root.querySelectorAll('[data-plabel]')];if(k>=tl.length||!pan.isConnected){this.revealDress();return;}const t=tl[k],pr=pan.getBoundingClientRect(),r=t.getBoundingClientRect();const dx=pr.left+pr.width*0.5-(r.left+r.width/2),dy=pr.top+pr.height*0.52-(r.top+r.height/2),big=Math.max(1.9,Math.min(3.4,pr.height*0.38/r.height*3.3)),rot=(Math.random()*2-1)*28,inner=t.firstElementChild,bare=on=>{t.style.background=on?'transparent':'';t.style.clipPath=on?'none':'';if(inner){inner.style.background=on?'transparent':'';inner.style.clipPath=on?'none':'';}const im=t.querySelector('img');if(im)im.style.filter=on?'drop-shadow(0 6px 10px rgba(0,0,0,0.35))':'';};
      t.style.transition='none';t.style.zIndex='1';bare(true);t.style.transform='translate('+dx+'px,'+dy+'px) rotate('+(rot*2).toFixed(1)+'deg) scale(0.4)';t.style.opacity='0';void t.offsetWidth;
      t.style.transition='transform .34s cubic-bezier(.2,1.5,.4,1),opacity .18s';t.style.transform='translate('+dx+'px,'+dy+'px) rotate('+rot.toFixed(1)+'deg) scale('+big.toFixed(2)+')';t.style.opacity='1';
      this._dt=setTimeout(()=>{t.style.transition='transform .44s cubic-bezier(.6,0,.25,1),opacity .3s';t.style.transform='none';t.style.opacity='1';
        this._dt=setTimeout(()=>{t.style.zIndex='';if(lb[k]){lb[k].style.transition='opacity .3s';lb[k].style.opacity='1';}this.setState({dressStep:k+1});this._dt=setTimeout(()=>step(k+1),90);},440);},560);};
    this._dt=setTimeout(()=>step(0),250);}
  // tonight's check-in from the server: show it as done (felt, fit) until the place's date rolls over
  syncCheckin(){const c=this.props.checkin;if(c)this.setState({felt:c.felt,rateFit:c.fit||null,saved:true,saveErr:''});else this.setState({felt:null,rateFit:null,saved:false});}
  setPreset(k,iv){setTimeout(()=>this.startDress(),60);this.setState({intensity:iv??null,preset:k,hourSel:null,felt:null,rateFit:null,saved:false,rateOpen:false});try{localStorage.setItem(LS,k);}catch(e){}}
  setProfile(p){const np={...this.state.profile,...p};this.setState({profile:np});try{localStorage.setItem('snug-profile',JSON.stringify(np));}catch(e){}}
  setAuthed(v){this.setState({authed:v,lgStep:0});try{localStorage.setItem('snug-auth',v?'1':'0');}catch(e){}this.win().scrollTo({top:0});}
  setOnboarded(v){this.setState({onboarded:v,obStep:0,obPick:null});try{localStorage.setItem(LSO,v?'1':'0');}catch(e){}this.win().scrollTo({top:0});}
  scrollToRef(ref){const el=ref.current,w=this.win();if(!el)return;w.scrollTo({top:el.getBoundingClientRect().top+w.scrollY-64,behavior:'smooth'});}
  componentDidMount(){
    setTimeout(()=>{this._ready=true;this.forceUpdate();},900);this.paint();this._iv=setInterval(()=>{if(this._phase!=='reveal')this.paint();this.panAB();},50);if(this._phase!=='ready')this.ldStart();
    setTimeout(()=>this.watchDress(),300);
    const w=this.win();
    this._rs=()=>{const el=this.rootRef.current;if(!el)return;const doc=el.ownerDocument;const vw=doc.documentElement.clientWidth||el.clientWidth,vh=(doc.defaultView&&doc.defaultView.innerHeight)||doc.documentElement.clientHeight;if(vw&&(vw!==this.state.vw||vh!==this.state.vh))this.setState({vw,vh});};
    w.addEventListener('resize',this._rs);this._rs();setTimeout(this._rs,50);setTimeout(this._rs,400);
    if(w.ResizeObserver&&this.rootRef.current){this._ro=new w.ResizeObserver(()=>this._rs());this._ro.observe(this.rootRef.current);}
    this._st=()=>{};w.addEventListener('storage',this._st);
  }
  componentWillUnmount(){const w=this.win();this._dead=true;cancelAnimationFrame(this._raf);clearTimeout(this._wd);if(this._io)this._io.disconnect();clearInterval(this._dv);clearTimeout(this._dt);if(this._ro)this._ro.disconnect();clearInterval(this._iv);clearTimeout(this._to);w.removeEventListener('resize',this._rs);w.removeEventListener('storage',this._st);}
  swingSign(inn,done){const el=this.rootRef.current&&this.rootRef.current.querySelector('[data-sway="lo"]');if(!el||!el.animate){done&&done();return;}
    const K=inn?[{transform:'translateY(16px) scale(0.96)',opacity:0},{transform:'none',opacity:1}]:[{transform:'none',opacity:1},{transform:'translateY(12px) scale(0.97)',opacity:0}];
    const a=el.animate(K,{duration:inn?260:180,easing:'cubic-bezier(.2,.8,.2,1)',fill:inn?'none':'forwards'});if(done)a.onfinish=done;}
  closeRateAnim(){if(this._closing)return;this._closing=true;this.swingSign(false,()=>{this._closing=false;this.setState({rateOpen:false});});}
  panAB(){const k=ABNOW;if(!k){ABDONE=null;return;}if(k===ABDONE)return;const root=this.rootRef.current;if(!root)return;const cards=[...root.querySelectorAll('[data-abcard]')];if(!cards.length)return;const first=!ABDONE;ABDONE=k;cards.forEach(c=>c.style.opacity='1');
    cards.forEach((c,i)=>{if(!c.animate)return;const end=c.style.transform||'';c.animate([{transform:'perspective(900px) '+end+' rotateY(-90deg) scale(0.9)'},{offset:0.7,transform:'perspective(900px) '+end+' rotateY(12deg) scale(1.02)'},{transform:'perspective(900px) '+end+' rotateY(0deg) scale(1)'}],{duration:750,delay:(first?120:0)+i*110,easing:'cubic-bezier(.3,0,.2,1)',fill:'backwards'});});}
  ldStart(){this._ldT0=performance.now();this._ldLast=this._ldT0;this._ldP=[];this._plan=null;this._poofed=false;this._ldKeys={};this.ldApply(this._ldT0);this.ldLoop();}
  // the frame loop; a bad frame is logged and skipped, never allowed to stop the loop
  ldLoop(){cancelAnimationFrame(this._raf);const tick=()=>{if(this._dead||this._phase==='ready')return;this._raf=requestAnimationFrame(tick);try{this.ldApply(performance.now());}catch(e){console.error('loading frame failed',e);}};this._raf=requestAnimationFrame(tick);}
  // back to the loading world (e.g. a different city was picked)
  ldRestart(){if(this._io){this._io.disconnect();this._io=null;}this._dressed=false;this._phase='loading';this.forceUpdate();this.ldStart();}
  ldReveal(){clearTimeout(this._rvDog);this._rvDog=setTimeout(()=>{if(!this._dead&&this._phase==='reveal'){console.warn('reveal stalled; finishing');this.ldFinish();}},7000);const g=this._geo;this._rvFrom=this._kid?{...this._kid}:{x:g?g.aCx:0,sit:false,pose:'stand',kiteU:0};this._phase='reveal';this._rvT0=performance.now();this.ldLoop();this.forceUpdate();}
  ldEls(){const r=this.rootRef.current,q=k=>r&&r.querySelector('[data-rv="'+k+'"]');
    return {av:q('av'),sh:q('sh'),fx:q('fx'),sg:q('sg'),board:q('board'),num:q('num'),nums:q('nums'),scroll:q('scroll'),scene:r&&r.querySelector('canvas[data-scene]'),load:r&&r.querySelector('canvas[data-loadfx]')};}
  ldApply(now){
    const g=this._geo,E=this.ldEls();if(!g||!E.av)return;
    const dt=Math.min(0.05,(now-(this._ldLast||now))/1000);this._ldLast=now;
    const t=(now-this._ldT0)/1000,aS=g.aS,k4=aS/4,loading=this._phase==='loading',r=loading?0:(now-this._rvT0)/1000;
    const op=(el,v)=>{if(el)el.style.opacity=String(v);};
    const pk=g.precipK==='rain'||g.precipK==='drizzle'?'rain':g.precipK==='snow'?'snow':'dust';
    const once=key=>{if(this._ldKeys[key])return false;this._ldKeys[key]=1;return true;};
    let kid,fade=1,lift=0,pose='stand',kiteU=0;const props=[];
    if(loading){
      if(!this._plan||this._planVw!==g.vw){this._plan=ldPlan(g);this._planVw=g.vw;}
      const P=this._plan,cyc=Math.floor(t/P.T);kid=ldKid(P,t%P.T,aS);pose=kid.pose;
      const s=kid.s,p=kid.p,lt=kid.lt,id=cyc+':'+P.segs.indexOf(s);
      const imgL=kid.x-20*aS,imgT=g.aT+kid.y+(pose==='sit'?g.sitDy:0),head=[kid.x,imgT+3*aS],hand=[imgL+30*aS,imgT+8*aS],mouth=[kid.x+2*aS,imgT+18.5*aS];
      if(s.k==='skycheck'&&pose==='kite'){ // hand up: feel the rain / catch a flake / test the wind
        if(pk==='rain'||pk==='snow'){const n=Math.floor(lt*5);if(once(id+':h'+n))ldPuff(this._ldP,pk==='rain'?'rain':'star',hand[0],hand[1],pk==='rain'?3:2,1);}
        else props.push(ctx=>{ctx.strokeStyle='rgba(255,255,255,0.85)';ctx.lineWidth=2;for(let i=0;i<3;i++){const ph=(lt*1.6+i/3)%1,x=hand[0]-30*k4+ph*70*k4,y=hand[1]-10*k4+i*9*k4;ctx.globalAlpha=Math.sin(ph*Math.PI);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+18*k4,y);ctx.stroke();}ctx.globalAlpha=1;});}
      if(s.k==='kite'){kiteU=eo(cl01(lt/1.4))*cl01((s.d-lt)/0.9);props.push(ctx=>drawKite(ctx,g.vw,hand[0],hand[1],k4,t,2,kiteU));}
      if(s.k==='dandelion'&&p>0.3&&p<0.62){const n=Math.floor(lt*14);if(once(id+':s'+n))ldPuff(this._ldP,'seed',mouth[0]+4*aS,mouth[1],1,1);}
      if(s.k==='nap'&&p>0.12&&p<0.9)props.push(ctx=>{for(let i=0;i<3;i++){const ph=(lt*0.5+i/3)%1;ldText(ctx,'z',head[0]+10*aS+ph*16*aS,head[1]+4*aS-ph*9*aS+Math.sin(ph*6)*1.5*aS,Math.round((18+ph*16)*k4),Math.sin(ph*Math.PI));}});
      if(s.k==='pigeon'){const side=kid.x<g.vw/2?1:-1,x0=side>0?g.vw+30:-30,stop=kid.x+side*24*aS;let px0,py0=g.groundY+2,mode='walk',dir=-side;
        if(p<0.4){px0=lerp(x0,stop,eio(p/0.4));}else if(p<0.66){px0=stop;mode='peck';}else{const q=(p-0.66)/0.34;px0=stop+side*q*q*g.vw*0.6;py0=g.groundY-q*140*aS*0.6;mode='fly';dir=side;}
        props.push(ctx=>ldPigeon(ctx,px0,py0,aS*1.25,t,mode,dir));}
      if(s.k==='butterfly'){let bx,by,per=false;const hx=head[0]+aS,hy=imgT+1*aS,sx=g.vw+30,sy=g.groundY-110*aS;
        if(p<0.12){bx=sx;by=sy;}else if(p<0.42){const q=eio((p-0.12)/0.3);bx=lerp(sx,hx,q);by=lerp(sy,hy,q)-Math.sin(q*Math.PI)*30*aS;}
        else if(p<0.82){bx=hx;by=hy;per=true;}else{const q=(p-0.82)/0.18;bx=lerp(hx,hx-60*aS,q);by=lerp(hy,hy-120*aS,q*q);}
        props.push(ctx=>ldBfly(ctx,bx,by+(per?0:Math.sin(t*9)*1.5*aS),aS*0.55,t,per,g.night,1));}
      if(s.k==='puddle'){props.push(ctx=>{ctx.fillStyle='rgba(120,150,190,0.55)';ctx.beginPath();ctx.ellipse(kid.x,g.groundY+2*aS,16*aS,3*aS,0,0,Math.PI*2);ctx.fill();});
        if(p>0.55&&once(id+':splash')){ldPuff(this._ldP,'rain',kid.x,g.groundY,14,1);ldPuff(this._ldP,'rain',kid.x,g.groundY,14,-1);}}
      if(s.k==='snowflake'){const q=cl01(p/0.5),fx0=hand[0]+30*aS*(1-q),fy0=lerp(g.groundY-160*aS*0.6,hand[1],q);if(p<0.5)props.push(ctx=>ldText(ctx,'✻',fx0,fy0,Math.round(18*k4),1));else if(once(id+':catch'))ldPuff(this._ldP,'star',hand[0],hand[1],8,0);}
      if(s.k==='stars'&&p>0.35&&p<0.6){const q=(p-0.35)/0.25;props.push(ctx=>{const x=g.vw*(0.2+q*0.5),y=g.groundY*0.15+q*g.groundY*0.12,L=80*k4;const sg=ctx.createLinearGradient(x-L,y-L*0.3,x,y);sg.addColorStop(0,'rgba(255,247,218,0)');sg.addColorStop(1,'rgba(255,247,218,'+(1-q)+')');ctx.strokeStyle=sg;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-L,y-L*0.3);ctx.lineTo(x,y);ctx.stroke();});}
      if(s.k==='ufo'){let ux,uy=Math.max(60,head[1]-g.aH*0.55-kid.y);const hx=kid.x;
        if(p<0.3)ux=lerp(-120,hx,eo(p/0.3));else if(p<0.8)ux=hx+Math.sin(t*2)*4*aS;else{const q=(p-0.8)/0.2;ux=hx+q*q*g.vw;uy-=q*120*aS*0.5;}
        const beam=p>0.34&&p<0.78?(g.groundY-uy)*Math.min(1,(p-0.34)/0.06,(0.78-p)/0.06):0;props.push(ctx=>ldUfo(ctx,ux,uy,aS*0.8,t,beam));fade*=1-0.75*Math.sin(p*Math.PI);}
      if(s.k==='dance'&&p>0.1&&p<0.9)props.push(ctx=>{for(let i=0;i<3;i++){const ph=(lt*0.7+i/3)%1,side=i%2?1:-1;ldText(ctx,i%2?'♪':'♫',kid.x+side*(14+ph*10)*aS,head[1]+10*aS-ph*20*aS,Math.round(20*k4*1.2),Math.sin(ph*Math.PI));}});
      [E.num,E.nums,E.fx,E.sg,E.board,E.scroll].forEach(el=>op(el,0));if(E.board)E.board.style.pointerEvents='none';
      if(E.scene){E.scene.dataset.ra='0';E.scene.dataset.bu=String(LOAD_BU);}
    }else{
      // stand up, stroll back, hop, poof: dressed for the day
      const f=this._rvFrom,tUp=f.pose!=='stand'?0.3:0,dWalk=Math.min(1,Math.max(0.2,Math.abs(g.aCx-f.x)/160)),tA=tUp+dWalk,tP=tA+0.35;
      if(r<tUp){kid={x:f.x,y:0,lean:0};pose=f.pose;if(f.pose==='kite'){kiteU=f.kiteU*(1-r/tUp);const hand=[f.x+10*aS,g.aT+8*aS];props.push(ctx=>drawKite(ctx,g.vw,hand[0],hand[1],k4,t,2,kiteU));}}
      else if(r<tA){const dir=Math.sign(g.aCx-f.x),q=(r-tUp)/dWalk;kid={x:lerp(f.x,g.aCx,eio(q)),y:-Math.abs(Math.sin((r-tUp)*3*Math.PI))*2*aS,lean:dir*4};}
      else if(r<tP){const q=(r-tA)/0.35;kid={x:g.aCx,y:-4*q*(1-q)*9*aS,lean:0};}
      else kid={x:g.aCx,y:0,lean:0};
      if(r>=tP&&!this._poofed){this._poofed=true;ldPuff(this._ldP,'cloud',g.aCx,g.aT+g.aH*0.55,12,0);ldPuff(this._ldP,'star',g.aCx,g.aT+g.aH*0.5,14,0);this.forceUpdate();}
      fade=1-cl01(r/0.6);lift=r*40;
      // the forecast grows out of the hills: ridge morphs into the comfort curve, the number climbs with it
      const q=eio(cl01((r-0.2)/1.5)),cv=g.curve.map((v,i)=>+lerp(LOAD_CURVE[i],v,q).toFixed(1)).join(',');
      [E.scene,E.num,E.nums].forEach(el=>{if(el&&el.dataset.curve)el.dataset.curve=cv;});if(E.scene){E.scene.dataset.ra=String(q);E.scene.dataset.bu=String(lerp(LOAD_BU,0.06+g.best*0.08,q));}
      const n=r<0.7?'':String(Math.max(1,Math.round(eo(cl01((r-0.7)/1.0))*g.score))),lab=g.label.slice(0,Math.ceil(g.label.length*cl01((r-1.3)/0.5)));
      [E.num,E.nums].forEach(el=>{if(el){el.dataset.num=n;el.dataset.lab=lab;}});
      op(E.num,cl01((r-0.6)/0.35));op(E.nums,cl01((r-1.9)/0.4));
      const so=eo(cl01((r-1.5)/0.6));[E.sg,E.fx].forEach(el=>{if(el){op(el,so);el.style.transform='translateY('+((1-so)*16).toFixed(1)+'px)';}});
      const bq=cl01((r-2)/0.8);if(E.board){op(E.board,bq>0?1:0);E.board.style.transform='translateY('+((1-eob(bq))*-140).toFixed(1)+'px)';}
      op(E.scroll,cl01((r-2.7)/0.4));
      if(r>=Math.max(3.1,tP+0.8)){this.ldFinish();return;}
      this.paint();
    }
    this._kid={x:kid.x,sit:pose!=='stand',pose,kiteU};
    const sit=pose==='sit';
    if(!this._poofed){const want=g.sprites[pose]||g.sprites.stand;if(E.av.getAttribute('src')!==want)E.av.setAttribute('src',want);
      E.av.style.transformOrigin='50% 100%';E.av.style.transform='translate('+(kid.x-g.aCx).toFixed(1)+'px,'+(kid.y+(sit?g.sitDy:0)).toFixed(1)+'px) rotate('+kid.lean+'deg)';
      if(E.sh)E.sh.style.transform='translateX('+(kid.x-g.aCx).toFixed(1)+'px) scale('+(1-Math.min(0.6,-kid.y/(40*aS))).toFixed(3)+')';}
    else{E.av.style.transform='';if(E.sh)E.sh.style.transform='';if(E.av.getAttribute('src')!==g.avatarSrc)E.av.setAttribute('src',g.avatarSrc);}
    const P=this._ldP;for(let i=P.length-1;i>=0;i--){const p=P[i];p.life-=dt;if(p.life<=0){P.splice(i,1);continue;}p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.kind==='seed')p.x+=Math.sin(p.life*3+p.w)*0.6;
      if(p.kind!=='star'&&p.kind!=='cloud'&&p.kind!=='seed'&&p.y>g.groundY+4&&p.vy>0){p.y=g.groundY+4;p.vy=0;p.vx*=0.5;}}
    const cv=E.load;if(!cv||!cv.parentElement)return;const W=cv.parentElement.clientWidth,H=cv.parentElement.clientHeight,px=2,bw=Math.ceil(W/px),bh=Math.ceil(H/px);
    if(cv.width!==bw||cv.height!==bh){cv.width=bw;cv.height=bh;cv.style.width=bw*px+'px';cv.style.height=bh*px+'px';}
    const ctx=cv.getContext('2d');ctx.setTransform(1/px,0,0,1/px,0,0);ctx.clearRect(0,0,W,H);
    if(fade>0)ldSky(ctx,g,t,fade,lift);
    props.forEach(fn=>{ctx.save();fn(ctx);ctx.restore();});
    P.forEach(p=>{const a=cl01(p.life/p.max);ctx.globalAlpha=p.kind==='cloud'?a*0.9:a;ctx.fillStyle=p.c;
      if(p.kind==='star'){const s=p.r;ctx.fillRect(p.x-s,p.y-s*0.3,s*2,s*0.6);ctx.fillRect(p.x-s*0.3,p.y-s,s*0.6,s*2);}
      else if(p.kind==='seed'){ctx.fillRect(p.x-0.5,p.y,1,4);ctx.beginPath();ctx.arc(p.x,p.y,p.r*1.4,0,Math.PI*2);ctx.fill();}
      else{ctx.beginPath();ctx.arc(p.x,p.y,p.kind==='cloud'?p.r*(1.4-a*0.4):p.r,0,Math.PI*2);ctx.fill();}});ctx.globalAlpha=1;
  }
  ldFinish(){this._phase='ready';cancelAnimationFrame(this._raf);clearTimeout(this._rvDog);const g=this._geo,E=this.ldEls();
    Object.values(E).forEach(el=>{if(el&&el.style){el.style.opacity='';el.style.transform='';el.style.pointerEvents='';}});
    if(g){[E.scene,E.num,E.nums].forEach(el=>{if(el&&el.dataset.curve)el.dataset.curve=g.curveStr;});if(E.scene){E.scene.dataset.ra='1';delete E.scene.dataset.bu;}[E.num,E.nums].forEach(el=>{if(el){el.dataset.num=''+g.score;el.dataset.lab=g.label;}});}
    this.forceUpdate(()=>{this.watchDress();this.paint();});}
  // while loading, a change of sky (placeholder -> real weather) dissolves instead of cutting
  ldCrossfade(){const g=this._geo;if(!g)return;const key=g.sceneKey;
    if(this._lastKey&&key!==this._lastKey&&this._phase!=='ready'){const cv=this.rootRef.current&&this.rootRef.current.querySelector('canvas[data-scene]');
      if(cv&&cv.width&&cv.animate){const s=cv.ownerDocument.createElement('canvas');s.width=cv.width;s.height=cv.height;s.getContext('2d').drawImage(cv,0,0);
        Object.assign(s.style,{position:'absolute',left:'0',top:'0',width:cv.style.width,height:cv.style.height,imageRendering:'pixelated',pointerEvents:'none'});cv.after(s);
        s.animate([{opacity:1},{opacity:0}],{duration:1100,easing:'ease-in-out'}).onfinish=()=>s.remove();}}
    this._lastKey=key;}
  watchDress(){if(this._io)return;const w0=this.win(),el=this.dressRef.current;if(el&&w0.IntersectionObserver){this._io=new w0.IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting&&!this._dressed){this._dressed=true;this.startDress();}if(!en.isIntersecting&&en.boundingClientRect.top>0)this._dressed=false;});},{threshold:0.35});this._io.observe(el);}}
  componentDidUpdate(pp,ps){this.ldCrossfade();if(pp.checkin!==this.props.checkin)this.syncCheckin();const lg=this.props.loginGoto;if(lg&&(!pp.loginGoto||pp.loginGoto.seq!==lg.seq)&&this.state.lgStep!==lg.step)this.setState({lgStep:lg.step});if(pp.onCheckin!==this.props.onCheckin&&this.state.saveErr)this.setState({saveErr:''});if(this._phase==='loading'&&!this.props.loading)this.ldReveal();else if(this._phase==='ready'&&this.props.loading&&!pp.loading)this.ldRestart();else if(this._phase!=='ready'){try{this.ldApply(performance.now());}catch(e){console.error('loading frame failed',e);}}if(!this._dressing&&this.rootRef.current){const hid=[...this.rootRef.current.querySelectorAll('[data-piece],[data-plabel]')].some(e=>e.style.opacity==='0');if(hid)setTimeout(()=>{if(!this._dressing)this.revealDress();},0);}if(ps&&!ps.rateOpen&&this.state.rateOpen)setTimeout(()=>this.swingSign(true),0);setTimeout(()=>this.paint(),0);setTimeout(()=>this.panAB(),20);if(pp.intensity!==this.props.intensity&&this.props.intensity!=null)this.setState({intensity:this.props.intensity});const s={};if(pp.preset!==this.props.preset&&PRESETS[this.props.preset])s.preset=this.props.preset;if(pp.units!==this.props.units&&this.props.units)s.units=this.props.units;if(pp.motion!==this.props.motion&&this.props.motion!=null)s.motion=this.props.motion;if(Object.keys(s).length)this.setState(s);}
  renderVals(){
    setAvatar(this.props.avatar);
    const st=this.state,pk=st.preset,P0=PRESETS[pk],PREF=prefsOf(st.picks),ADJ=P0&&P0.noTune?0:tuneAdj(P0,PREF),PK0=pkind(P0),IDEF=PK0?(INTDEF[pk]??0.5):0,INT=PK0?(P0&&P0.noTune?IDEF:(st.intensity??this.props.intensity??IDEF)):0,IADJ=PK0&&!P0.noTune?Math.round((IDEF-INT)*26):0,cl1=v=>Math.max(1,Math.min(100,v+ADJ+IADJ)),P={...P0,score:cl1(P0.score),curve:P0.curve.map(cl1),start:st.night&&P0.cond!=='night'&&(P0.start<19&&P0.start>5)?21:P0.start},cond=P.cond,C=st.units==='°C';
    if(this._phase==null)this._phase=this.props.loading?'loading':'ready';const LDP=this._phase==='loading'||(this._phase==='reveal'&&!this._poofed),LD0=this._phase==='loading';if(LDP){P.act='stand';P.pose='stand';}
    const CITY=this.props.city||st.profile.city||'philadelphia',dateLine=new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}).toLowerCase();
    ABNOW='';
    const vw=st.vw||1024,vh=st.vh||800,m=vw<760,inApp=this.props.showApp!=null?!!this.props.showApp:st.authed,LHb=m?Math.max(640,vh):Math.max(620,vh),LHx=m?Math.max(1180,vh):LHb,LHm=(m&&st.lgStep===2)?Math.max(1180,vh):Math.max(640,vh),rating=st.rateOpen;
    const NIGHT=st.night&&cond!=='night',SCK=NIGHT?nightKey(cond):cond;const dark=NIGHT||cond==='night'||cond==='rain'||cond==='sunset';
    const TH=dark?{bg:'rgba(22,26,48,0.42)',fg:'#f3efe6',muted:'rgba(243,239,230,0.8)',border:'rgba(255,255,255,0.14)',track:'rgba(255,255,255,0.16)'}:{bg:'rgba(255,251,244,0.56)',fg:'#27233a',muted:'#4a4558',border:'rgba(255,255,255,0.5)',track:'rgba(39,35,58,0.12)'};
    const T=f=>(C?Math.round((f-32)*5/9):f)+'°',Wv=w=>''+(C?Math.round(w*1.609):w),WUn=C?'km/h':'mph',WU='Wind '+WUn;
    const fit0=P.outfit?wearOf(P.outfit):outfitFor(P.temp,cond,P.wind),fit=st.night&&fit0.o.acc.includes('sunglasses')?wearOf({...fit0.o,acc:fit0.o.acc.filter(a=>a!=='sunglasses')}):fit0;
    const feltV=st.felt??P.score,delta=feltV-P.score;
    const moodOf=f=>f>=80?'happy':f>=65?'content':f>=50?'meh':'grumpy';
    const mood=rating?(st.rateFit==='too cold'?'cold':st.rateFit==='too warm'?'hot':st.felt!=null?moodOf(st.felt):P.mood):P.mood;
    const BURIED=pkind(P)==='snow'&&(st.intensity??this.props.intensity??INTDEF[pk]??0.5)>0.62;
    const avatarSrc=LDP?sprite(LOAD_FIT,'happy','stand'):sprite(fit.o,BURIED?'cold':mood,P.pose);
    const hr=i=>{const h=(P.start+i)%24;return (h%12||12)+' '+(h<12?'AM':'PM');};
    const hrs=i=>{const h=(P.start+i)%24;return (h%12||12)+(h<12?'a':'p');};
    const best=P.curve.indexOf(Math.max(...P.curve)),sel=st.hourSel??best;
    const heroH=m?Math.max(600,vh):LHm;
    const pxS=4,aS=4;
    const pL=m?12:32,pT=m?12:28,pW=m?Math.round(Math.max(196,Math.min(236,vw*0.54))):Math.round(Math.min(390,Math.max(330,vw*0.27))),pPad=m?14:22;
    const groundY=m?Math.round(heroH*0.73):Math.round(heroH*0.7);
    const aW=46*aS,aH=58*aS,areaL=0,aCx=m?Math.round(vw*0.36):Math.round(vw*0.44);
    const sitting=P.pose==='sit';
    const aL=aCx-20*aS,aT=sitting?groundY+(P.act==='picnic'?14:6)*aS/4-45*aS:groundY-56*aS;
    const pWn=m?vw-24:pW,gW=pWn-2-2*pPad,gH=m?150:(heroH<760?140:168);
    const G=graphSvg(P.curve,sel,best,gW,gH,false);
    const tipTop=Math.max(0,Math.round(G.selY-30)),tipTx=sel<2?'-20%':sel>9?'-80%':'-50%';
    const dK=m?1.15:1.3,dBy=m?Math.round(groundY+(heroH-groundY)*0.5):Math.min(heroH-70,groundY+Math.round((heroH-groundY)*0.5));
    const sp=Math.max(130*dK,Math.min(260,(vw-areaL)/3.2));
    const dSx=m?Math.round(vw*0.79):Math.round(vw*0.44+Math.min(300,vw*0.2))||Math.round(Math.min(vw-90*dK,aCx+sp));
    const hBy=m?66:Math.round(Math.max(90,heroH*0.15));
    const fd=P.feels-P.temp,cw=P.clouds<=5?'Clear':P.clouds<=25?'Mostly clear':P.clouds<=62?'Partly cloudy':P.clouds<=87?'Mostly cloudy':'Overcast';
    const K=dK,wd='#fff1d6',wsh='0 1px 0 rgba(60,30,10,0.55)';
    const signs=[{a:T(P.temp),b:'feels '+T(P.feels),lw:Math.round(88*K),h:Math.round(40*K),f1:Math.round(17*K),f2:Math.max(10,Math.round(10*K)),fd:'column',gap:1,c:wd,sh:wsh},
      {a:Wv(P.wind)+' '+WUn,b:COMPASS[Math.round(P.dir/22.5)%16]+' · gusts '+Wv(P.gust),lw:Math.round(82*K),h:Math.round(34*K),f1:Math.round(13*K),f2:Math.max(9,Math.round(8.5*K)),fd:'column',gap:1,c:wd,sh:wsh},
      {a:P.clouds+'% cloud cover',b:'· '+cw.toLowerCase(),lw:Math.round(246*K),h:Math.round(28*K),f1:Math.round(12.5*K),f2:Math.round(11*K),fd:'row',gap:5,c:'#3b2a2a',sh:'none'}];
    const on=a=>a?{bg:INK,fg:CREAM}:{bg:'transparent',fg:INK};
    const onDark=a=>a?{bg:CREAM,fg:INK}:{bg:'rgba(251,246,236,0.1)',fg:CREAM};
    const step=Math.min(st.obStep,7),pair=PAIRS[step];
    const obStats=p=>[{icon:icon('therm'),value:T(p[1]),label:'Temp'},{icon:icon('wind'),value:Wv(p[2]),label:WU},{icon:icon('clouds'),value:p[3]+'%',label:'Clouds'}];
    const pick=k=>{if(st.obPick)return;this.setState({obPick:k});clearTimeout(this._to);this._to=setTimeout(()=>this.setState(s=>({obStep:s.obStep+1,obPick:null})),420);};
    const cardSh=k=>st.obPick===k?'0 0 0 3px '+INK+',0 16px 36px rgba(24,20,48,0.16)':'0 1px 0 rgba(31,27,46,0.06),0 10px 30px rgba(24,20,48,0.08)';
    const onSlide=e=>{const el=this.sliderRef.current;if(!el)return;const w=this.win();const upd=cx=>{const rc=el.getBoundingClientRect();const v=Math.round(Math.max(1,Math.min(100,(cx-rc.left)/rc.width*100)));this.setState({felt:v,saved:false});};upd(e.clientX);const mv=ev=>upd(ev.clientX);const up=()=>{w.removeEventListener('pointermove',mv);w.removeEventListener('pointerup',up);};w.addEventListener('pointermove',mv);w.addEventListener('pointerup',up);};
    const savedOk=st.saved&&st.felt!=null;
    const fitHints={'too cold':'got it. warmer layer next time.','just right':'nice. same fit next time.','too warm':'got it. lighter next time.'};
    const dressList=(()=>{const o=fit.o,L=[];const A=(k,name,role)=>L.push({src:itemSprite(k),name,role,k});
      A(o.top,nameOf(o.top),'torso');A(o.bottom,nameOf(o.bottom),'legs');A('shoe',nameOf('shoe'),'feet');if(o.outer!=='none')A(o.outer,nameOf(o.outer),'over the top');if(o.acc.includes('scarf'))A('scarf','scarf','neck');if(o.acc.includes('beanie'))A('beanie','beanie','head');if(o.acc.includes('sunglasses'))A('sunglasses','sunglasses','eyes');if(o.acc.includes('umbrella'))A('umbrella','umbrella','hand');return L;})();
    this._dressN=dressList.length;
    const shown=new Set(dressList.slice(0,Math.min(st.dressStep,dressList.length)).map(p=>p.k));
    const partial={top:fit.o.top,bottom:fit.o.bottom,outer:shown.has(fit.o.outer)?fit.o.outer:'none',acc:fit.o.acc.filter(a=>shown.has(a))};
    const hsR=Math.max(40,Math.min(groundY*0.36,280)),cvlo=Math.min(...P.curve)-10,cvhi=Math.max(...P.curve)+4,RX=i=>vw*(0.06+i*0.08),RY=i=>groundY-hsR*(0.3+0.66*(P.curve[i]-cvlo)/(cvhi-cvlo));
    const tagSoft=(i,t)=>({x:Math.round(RX(i)),y:Math.round(RY(i)-10),t,bg:'transparent',fg:'#ffffff',fs:12,pad:'0',ts:'0 1px 3px rgba(20,18,40,0.6)'});
    const ridgeTags=[],_rt=m?[]:[2,4,6,8,10].filter(i=>i!==best&&i!==sel&&RX(i)>vw*0.045+400).map(i=>tagSoft(i,hrs(i)));
    if(false){ridgeTags.push({x:Math.round(Math.max(RX(best)+18,vw*0.045+470)),y:Math.round(RY(best)-58*Math.max(0.35,Math.min(1.3,groundY/560))),t:'best · '+hr(best)+' · '+P.curve[best],bg:'rgba(255,252,246,0.95)',fg:INK,fs:13,pad:'4px 10px',ts:'none'});
      if(sel!==best)ridgeTags.push({x:Math.round(RX(sel)),y:Math.round(RY(sel)-14),t:(sel===0?'now':hr(sel))+' · '+P.curve[sel],bg:TINT[band(P.curve[sel])],fg:INK,fs:13,pad:'4px 10px',ts:'none'});}
    const rgT=Math.round(groundY-hsR*1.05-30);
    // phone score size: a little smaller on short phones so the number and word end above snug's head
    const NF=m&&vh<700?106:m&&vh<760?118:150;
    this._geo={aT,aW,aH,aCx,aS,groundY,heroH,vw,m,hsR,sitDy:12.5*aS,cond:SCK,night:NIGHT||cond==='night',wind:P.wind,city:CITY,precipK:pkind(P),sceneKey:SCK+'|'+(P.precip||'')+'|'+(P.storm||P.fxk||'')+'|'+st.season,
      curve:P.curve,curveStr:P.curve.join(','),best:P.curve.indexOf(Math.max(...P.curve)),score:P.score,label:P.label.toLowerCase(),avatarSrc,sprites:{stand:sprite(LOAD_FIT,'happy','stand'),sit:sprite(LOAD_FIT,'content','sit'),kite:sprite(LOAD_FIT,'happy','kite')}};
    return {
      rootRef:this.rootRef,dressRef:this.dressRef,dressSprite:sprite(partial,P.mood==='cold'||P.mood==='hot'?P.mood:'content','stand'),dressW:138,dressH:174,dressL:60,winW:m?180:220,winH:m?210:220,ctaMt:m?14:0,dressPadX:m?14:28,mFg:'#fff8e6',mMuted:'rgba(255,248,230,0.85)',meadowBg:(PAL[cond]||PAL.sunny).g1,patchBg:rgba((PAL[cond]||PAL.sunny).path,0.0),kidX:m?Math.round(vw/2):Math.round(vw/2-((m?170:200)+22)/2),kidY:m?330:340,pathL:Math.round(vw*0.66-(heroH-groundY)*0.45),pathR:Math.round(vw*0.66+(heroH-groundY)*0.55),tagsW:m?170:200,cardPadT:m?54:58,sceneCond:SCK,cloudPct:P.cloudLow!=null&&P.cloudMid!=null?Math.round(100*(1-(1-P.cloudLow/100)*(1-P.cloudMid/100))):P.clouds,cirrusPct:P.cloudHigh!=null?Math.round(P.cloudHigh):'',winSky0:PAL[SCK].sky[1],winSky1:PAL[SCK].sky[2],wallBg:mix('#f6ecd9',PAL[SCK].g0,0.06),awning:pix('awn',()=>{let p='';p+='<rect width="24" height="28" fill="#d65a4a"/><rect x="24" width="24" height="28" fill="#fbf1dc"/><rect y="0" width="48" height="3" fill="#5e3c20"/>';p+='<path d="M0 28h24v4h-2v2h-3v2h-6v-2h-3v-2H2v-2H0z" fill="#d65a4a"/><path d="M24 28h24v4h-2v2h-3v2h-6v-2h-3v-2h-8v-2h-2z" fill="#fbf1dc"/><rect y="26" width="48" height="2" fill="rgba(60,25,10,0.18)"/>';return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 40" shape-rendering="crispEdges">'+p+'</svg>');}),replayDress:()=>this.startDress(),
      seasonOpts:[['auto','season: auto ('+(seasonNow('auto').replace('|',' · ')||'none')+')'],['none','no event'],['clim:spring','spring (plain)'],['clim:summer','summer (plain)'],['clim:autumn','autumn (plain)'],['clim:winter','winter (plain)'],...EV_NAMES].map(([v,t])=>({v,t,sel:st.season===v})),season:seasonNow(st.season),seasonAutoName:'auto ('+(seasonNow('auto')||'none')+')',onSeason:e=>{const v=e.target.value;this.setState({season:v});try{localStorage.setItem('snug-season',v);}catch(er){}},
      intV:PK0?INT.toFixed(2):'',pkindV:PK0,avFilter:(PK0==='rain'||PK0==='drizzle'||PK0==='sleet')&&INT>0.7?'saturate('+(1-(INT-0.7)*1.2).toFixed(2)+') brightness('+(1-(INT-0.7)*0.5).toFixed(2)+') hue-rotate(-8deg)':'none',showInt:!!PK0,intVal:Math.round(INT*100),intName:{rain:'rain',drizzle:'rain',sleet:'sleet',hail:'hail',snow:'snow'}[PK0]||'rain',intWord:INT<0.25?'light':INT<0.5?'moderate':INT<0.75?'heavy':(PK0==='snow'?'deep':PK0==='hail'?'severe':'flooding'),onInt:e=>this.setState({intensity:+e.target.value/100}),
      ridgeTags,rgL:Math.round(vw*0.02),rgW:Math.round(vw*0.96),rgT,rgH:Math.round(groundY-rgT),ridgeLeave:()=>this.setState({hourSel:null}),sliderRef:this.sliderRef,inApp,inTune:false,inLogin:!inApp,inRate:rating,notRate:!rating,
      cond,windMph:P.wind,act:P.act,precip:P.precip||'',storm:P.storm?'storm':(P.fxk||'0'),mood,shiver:BURIED?'1':mood==='cold'?'1':'0',secPad:m?'28px 16px 40px':'48px 32px 72px',pxS,aS,
      presetOpts:['worst','front',...PKEYS].map(k=>({...onDark(k===pk),name:PRESETS[k].name,icon:icon(PRESETS[k].icon||PRESETS[k].cond),onClick:()=>this.setPreset(k)})),
      todOpts:[['day',false],['night',true]].map(([n,v])=>({...onDark(st.night===v),name:n,onClick:()=>{this.setState({night:v});try{localStorage.setItem('snug-night',v?'1':'0');}catch(e){}}})),
      unitOpts:['°F','°C'].map(u=>({...onDark(u===st.units),name:u,onClick:()=>this.setState({units:u})})),
      replayTune:()=>{this.setOnboarded(false);this.setAuthed(false);this.setState({picks:[],obStep:0,obPick:null});try{localStorage.setItem('snug-picks','[]');}catch(e){}},doLogin:()=>this.setAuthed(true),lgGround:m?((LHx-LHb*0.1)/LHx).toFixed(4):0.8,
      ...(()=>{const pf=st.profile,ls=st.lgStep,go=n=>this.setState({lgStep:n});
        const wood=['url(\'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2216%22%20shape-rendering%3D%22crispEdges%22%3E%3Crect%20width%3D%2232%22%20height%3D%2216%22%20fill%3D%22%23a8743f%22%2F%3E%3Crect%20y%3D%227%22%20width%3D%2232%22%20height%3D%221%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20y%3D%2215%22%20width%3D%2232%22%20height%3D%221%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%222%22%20width%3D%227%22%20height%3D%221%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%224%22%20width%3D%229%22%20height%3D%221%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2210%22%20width%3D%2211%22%20height%3D%221%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20x%3D%2224%22%20y%3D%2212%22%20width%3D%225%22%20height%3D%221%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%2210%22%20width%3D%222%22%20height%3D%222%22%20fill%3D%22%238a5c30%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%220%22%20width%3D%2230%22%20height%3D%221%22%20fill%3D%22%23bf8a52%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%228%22%20width%3D%228%22%20height%3D%221%22%20fill%3D%22%23bf8a52%22%2F%3E%3C%2Fsvg%3E\') 0 0/64px 32px','url(\'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2216%22%20shape-rendering%3D%22crispEdges%22%3E%3Crect%20width%3D%2232%22%20height%3D%2216%22%20fill%3D%22%239a6a3a%22%2F%3E%3Crect%20y%3D%227%22%20width%3D%2232%22%20height%3D%221%22%20fill%3D%22%237c5129%22%2F%3E%3Crect%20y%3D%2215%22%20width%3D%2232%22%20height%3D%221%22%20fill%3D%22%237c5129%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%222%22%20width%3D%227%22%20height%3D%221%22%20fill%3D%22%237c5129%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%224%22%20width%3D%229%22%20height%3D%221%22%20fill%3D%22%237c5129%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2210%22%20width%3D%2211%22%20height%3D%221%22%20fill%3D%22%237c5129%22%2F%3E%3Crect%20x%3D%2224%22%20y%3D%2212%22%20width%3D%225%22%20height%3D%221%22%20fill%3D%22%237c5129%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%2210%22%20width%3D%222%22%20height%3D%222%22%20fill%3D%22%237c5129%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%220%22%20width%3D%2230%22%20height%3D%221%22%20fill%3D%22%23b07a44%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%228%22%20width%3D%228%22%20height%3D%221%22%20fill%3D%22%23b07a44%22%2F%3E%3C%2Fsvg%3E\') 0 0/64px 32px'];
        const mk=(list,selFn,clickFn)=>list.map((l,i)=>{const r=i%2===0,sel=selFn(l);return {label:l,sel,g:false,onClick:()=>clickFn(l),dx:(r?1:-1)*(m?10:22),rot:((i*37)%5-2)*0.5,clip:r?'clip-path:polygon(0 0,calc(100% - 20px) 0,100% 50%,calc(100% - 20px) 100%,0 100%)':'clip-path:polygon(20px 0,100% 0,100% 100%,20px 100%,0 50%)',pad:r?'0 30px 0 16px':'0 16px 0 30px',jc:r?'flex-start':'flex-end',bg:sel?'url(\'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2216%22%20shape-rendering%3D%22crispEdges%22%3E%3Crect%20width%3D%2232%22%20height%3D%2216%22%20fill%3D%22%23c08c52%22%2F%3E%3Crect%20y%3D%227%22%20width%3D%2232%22%20height%3D%221%22%20fill%3D%22%239a6a3a%22%2F%3E%3Crect%20y%3D%2215%22%20width%3D%2232%22%20height%3D%221%22%20fill%3D%22%239a6a3a%22%2F%3E%3Crect%20x%3D%223%22%20y%3D%222%22%20width%3D%227%22%20height%3D%221%22%20fill%3D%22%239a6a3a%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%224%22%20width%3D%229%22%20height%3D%221%22%20fill%3D%22%239a6a3a%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2210%22%20width%3D%2211%22%20height%3D%221%22%20fill%3D%22%239a6a3a%22%2F%3E%3Crect%20x%3D%2224%22%20y%3D%2212%22%20width%3D%225%22%20height%3D%221%22%20fill%3D%22%239a6a3a%22%2F%3E%3Crect%20x%3D%2222%22%20y%3D%2210%22%20width%3D%222%22%20height%3D%222%22%20fill%3D%22%239a6a3a%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%220%22%20width%3D%2230%22%20height%3D%221%22%20fill%3D%22%23d6a468%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%228%22%20width%3D%228%22%20height%3D%221%22%20fill%3D%22%23d6a468%22%2F%3E%3C%2Fsvg%3E\') 0 0/64px 32px':wood[i%2],edge:sel?'#2e1a0c':'#4a2e16'};});
        const ob=Math.min(st.obStep,7),pair=PAIRS[ob];
        const record=k=>{if(st.obPick)return;const picks=[...(st.picks||[]).filter(p=>p.i!==ob),{i:ob,pick:k}];this.setState({obPick:k,picks});try{localStorage.setItem('snug-picks',JSON.stringify(picks));}catch(e){}clearTimeout(this._to);this._to=setTimeout(()=>this.setState(s2=>s2.obStep>=7?{obStep:8,obPick:null,lgStep:3}:{obStep:s2.obStep+1,obPick:null}),380);};
        const pr=prefsOf(st.picks);
        let q,tag,sub='',pl=[],city=false,skies=false,google=false,ab=false,done=false;
        if(ls===0){tag='WELCOME TO';q='snug';sub='know how today will feel before you step outside';skies=true;google=true;}
        else if(ls===1){tag='STEP 1 OF 2';q='where are you from?';sub='so we can pull your local forecast';city=true;
}
        else if(ls===2){tag='STEP 2 OF 2 · '+(ob+1)+' OF 8';q='which day feels better?';sub='tap the one you’d rather spend outside';ab=true;}
        else {tag='ALL SET';q='you’re tuned';sub='snug adjusts every forecast to this';done=true;}
        const postW=m?Math.min(340,vw-32):(ab?560:380),abW=m?Math.min(300,vw-48):250;
        const keys=(()=>{if(!SKYPICK){try{const v=JSON.parse(sessionStorage.getItem('snug-skypick')||'null');if(Array.isArray(v)&&v.every(k=>PRESETS[k])&&v.length===PKEYS.length)SKYPICK=v;}catch(e){}}if(!SKYPICK){const a=[...PKEYS];for(let q=a.length-1;q>0;q--){const r=Math.floor(Math.random()*(q+1));[a[q],a[r]]=[a[r],a[q]];}SKYPICK=a;try{sessionStorage.setItem('snug-skypick',JSON.stringify(a));}catch(e){}}const N=m?6:8;let ks=SKYPICK.slice(0,N);if(!this._skyKeep)this._skyKeep={};if(!ks.includes(pk))ks[N-1]=pk;return ks;})(),lineW=m?Math.min(360,vw-20):600,nT=keys.length,tagW=m?44:40,sag=m?26:34,pad=tagW/2+6,lineH=sag+(m?110:110),XT=i=>pad+i*(lineW-2*pad)/(nT-1),YT=x=>6+sag*4*((x)/lineW)*(1-(x)/lineW);
        const lineSrc='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+lineW+' '+lineH+'"><path d="M0 6 Q'+(lineW/2)+' '+(6+sag*2)+' '+lineW+' 6" fill="none" stroke="#e8dcc6" stroke-width="2.5"/><path d="M0 7.5 Q'+(lineW/2)+' '+(7.5+sag*2)+' '+lineW+' 7.5" fill="none" stroke="rgba(60,40,20,0.35)" stroke-width="1"/><rect x="0" y="0" width="6" height="14" fill="#6b4424"/><rect x="'+(lineW-6)+'" y="0" width="6" height="14" fill="#6b4424"/></svg>');
        return {lineW,lineH,lineSrc,tagW,tagIn:m?36:32,tagInH:m?40:36,tagIc:m?24:22,lineTxt:'try a sky',lineSag:sag,lineTags:keys.map((k,i)=>{const x=XT(i);return {name:PRESETS[k].name,icon:icon(PRESETS[k].icon||PRESETS[k].cond),x:Math.round(x-tagW/2),y:Math.round(YT(x)-2),bg:k===pk?'#4a2e16':'#fbf3e2',edge:k===pk?'#f2c230':'#6b4424',onClick:()=>this.setPreset(k,pkind(PRESETS[k])?Math.round((0.08+Math.random()*0.9)*100)/100:null)};}),stepQ:q,stepTag:tag,stepSub:sub,stepSubOn:!!sub,qFs:ls===0?(m?48:64):(m?22:30),planks2:pl,showCityIn:city,showSkies:skies,showGoogle:google,showAB:ab,showDone:done,cityText:st.cityText,
          gPanelW:m?Math.min(290,vw-56):300,gBtnH:m?58:50,doGoogle:()=>go(1),
          abDir:m?'column':'row',abGap:m?10:18,abW,abH:m?Math.round(abW*0.36):150,windUnit:C?'km/h':'mph',
          lgPan:m?LHm-LHx:0,lgBaseH:LHx,lgSkyTop:(PAL[cond]||PAL.sunny).sky[0],panTr:this._ready?'transform 1.6s cubic-bezier(.45,0,.2,1)':'none',plTr:this._ready?'transform .15s':'none',abKey:(ABNOW=ls===2?'ab'+ob:''),abOp:ls===2&&ABNOW!==ABDONE?0:1,abCards:[['A',pair[0],ob*2+2],['B',pair[1],ob*2+1]].map(([tg,p,seed],i)=>({tag:tg,cond:p[0],wind:p[2],seed,t:T(p[1]),w:Wv(p[2]),cl:p[3]+'%',onClick:()=>record(tg),rot:i?1.2:-1.2,ty:st.obPick===tg?-6:0,edge:st.obPick===tg?'#f2c230':'#4a2e16'})),
          abSame:()=>record('='),
          prefLines:pr?[{k:'home',v:CITY},{k:'ideal temp',v:T(pr.ideal)},{k:'wind',v:pr.windAvoid>3?'less':pr.windAvoid<-3?'more':'any'},{k:'sky',v:pr.cloudAvoid>15?'sunny':pr.cloudAvoid<-15?'cloudy':'any'}]:[{k:'home',v:CITY}],
          finishLogin:()=>{if(this.props.onFinishLogin){this.props.onFinishLogin(prefsOf(st.picks));this.setState({lgStep:0});this.win().scrollTo({top:0});return;}this.setState({authed:true,onboarded:true,lgStep:0});try{localStorage.setItem('snug-auth','1');localStorage.setItem(LSO,'1');}catch(e){}this.win().scrollTo({top:0});},
          onCityText:e=>this.setState({cityText:e.target.value}),onCity:e=>{e.preventDefault();const v=st.cityText.trim().toLowerCase();if(v){this.setProfile({city:v});this.setState({cityText:''});setTimeout(()=>go(2),200);}},
          hdrInW:m?Math.min(300,vw-56):(ls===2?420:330),hdrInH:(()=>{const w=m?Math.min(300,vw-56):(ls===2?420:330),fb=ls===0?(m?48:64):(m?22:30),cw=fb*0.52,lines=Math.max(1,Math.ceil(q.length*cw/(w-8)));const sl=sub?Math.max(1,Math.ceil(sub.length*7.2/(w-8))):0;return Math.round(22+lines*fb*(fb>40?0.86:1.08)+(sl?(fb>40?6:6)+sl*18:0)+4);})(),postW,plankH:m?38:(vh<700?36:44),plankGap:m?7:(vh<700?6:10),plankW:m?Math.min(250,vw-90):270,hdrW:m?Math.min(280,vw-40):320,postL:m?Math.max(12,Math.round(vw/2-postW/2)):Math.round(vw*0.36-postW/2),postT:m?Math.round(Math.max(110,vh*0.2)):Math.round(Math.max(80,vh*0.15)),postH:Math.round((m?LHm:Math.max(620,vh))*(m?0.9:0.8))-(m?Math.round(Math.max(110,vh*0.2)):Math.round(Math.max(80,vh*0.15))),
          navB:m?14:22,navPad:m?'12px 18px':'6px 12px',lgBack:()=>ls>0&&go(ls-1),backOp:ls>0&&ls<3?1:0,backPe:ls>0&&ls<3?'auto':'none',lgNext:()=>{if(ls===1)go(2);else if(ls===2)go(3);},nextOp:ls===1||ls===2?1:0,nextPe:ls===1||ls===2?'auto':'none',nextLabel:ls===1?(this.props.placeSet||pf.city?'next →':'skip →'):'skip →',
          steps5:[0,1,2,3].map(k=>({w:k===ls?22:10,bg:k<=ls?'#f2c230':'rgba(255,241,210,0.35)'}))};})(),
      loginH:m?LHm:Math.max(620,vh),lgCardT:m?40:Math.round(Math.max(60,vh*0.1)),lgAL:m?Math.round(vw-12-38*3):Math.round(vw*0.72)-20*aS,lgAT:m?Math.round(LHx-LHb*0.1)-56*3:Math.round(Math.max(620,vh)*0.8)-56*aS,lgW:m?46*3:aW,lgH:m?58*3:aH,loginSprite:sprite(fit.o,P.mood,'stand'),
      gLogo:pix('glogo',()=>'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.6 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.2 0-11.5-4.2-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>')),
      loginSkies:PKEYS.map(k=>({name:PRESETS[k].name,icon:icon(PRESETS[k].icon||PRESETS[k].cond),bg:k===pk?'#27233a':'#f3ead6',sh:k===pk?'0 0 0 2px #27233a':'inset 0 0 0 1px rgba(31,27,46,0.1)',onClick:()=>this.setPreset(k)})),skyName:P.name.toLowerCase()+' · '+T(P.temp),enterApp:()=>this.setOnboarded(true),onChangeStyle:this.props.onChangeStyle||null,
      openRate:()=>this.setState({rateOpen:true}),closeRate:()=>this.closeRateAnim(),
      logoSrc:sprite(outfitFor(70,'partly',5).o,'content','stand'),tunedOn:false,tunedLine:PREF?('tuned for you · '+(ADJ===0?'no change today':(ADJ>0?'+':'−')+Math.abs(ADJ)+' vs average')+' · sweet spot '+T(PREF.ideal)):'',placeLine:m?CITY:CITY+' · '+dateLine,cityName:CITY,dateLine,ld:this._phase!=='ready',bR:m?14:30,bT:(m?10:18)+40,sgnRopeW:m?92:150,sgnTxtW:m?112:210,sgnSky:({sunny:'#9fd0f2',partly:'#b6d2ea',sunset:'#f3b08a',heat:'#f1e2bc',overcast:'#c1c8d2',rain:'#8d97aa',snow:'#d7e1ec',night:'#3a4478'})[cond]||'#b6d2ea',sgnBadge:savedOk?'✓':'•',
      heroH,groundY,pL:0,pT:0,pW,pWc:m?'auto':'min(760px, calc(100% - 64px))',pPos:'relative',pMaxHc:'none',pMargin:m?'0 12px':'0 auto',wearMt:m?10:16,zoom:m?1.45:1,mob:m,desk:!m,skyNum:LD0?'':''+P.score,skyLabel:LD0?'':P.label.toLowerCase(),skyCap:'',skyMode:m?'center':'ridge',hsR,skyY:0,skyTop:0,skyRx:0,nFs:NF,lFs:m?(vh<760?26:30):34,skyAl:m?'center':'left',labMode:m?'below':'right',numX:m?0:Math.round(vw*0.045),numBase:m?Math.round(Math.max(150,heroH*0.19)+16+14+NF*0.74):Math.round(RY(0)-26),capAl:m?'center':'left',capStroke:'rgba(12,10,18,0.78)',capX:m?Math.round(vw/2):Math.round(vw*0.045),capY:m?Math.round(Math.max(150,heroH*0.19)+16):Math.round(RY(0)-26-150*0.74-16),sunX:m?0.84:0.8,curveStr:m?'':(LD0?LOAD_CURVE:P.curve).join(','),hourStr:P.curve.map((_,i)=>i===0?'now':hrs(i).replace('a','am').replace('p','pm')).join(','),bestI:best,selI:sel,skyShadow:m?'rgba(12,10,18,0.6)':(dark?'rgba(10,12,30,0.45)':'rgba(30,55,100,0.35)'),pPad,scoreFs:m?56:(heroH<760?72:92),wearFs:m?14:17,rTitleFs:m?20:26,
      gBg:TH.bg,gFg:TH.fg,gMuted:TH.muted,gBorder:TH.border,gTrack:TH.track,topo:pix('topo3'+pk+CITY+(m?'m':'d'),()=>{const W=m?400:1000,H=m?900:800,cv=P.curve,mx=Math.max(...cv),mn=Math.min(...cv),bi=cv.indexOf(mx),ink='rgba(39,35,58,';let p='';
        const bx=W*(0.12+bi/11*0.5),by=m?150:190,L=cv.slice(0,bi+1),R=cv.slice(bi);const spanL=(bi+1)/12,spanR=(12-bi)/12;
        const shp=th=>{const cx=Math.cos(th);const side=cx<0?spanL:spanR;const st=0.75+side*1.1;const w=1+0.06*Math.sin(th*3+1.3)+0.035*Math.sin(th*5+0.4);return [Math.cos(th)*st*1.5*w,Math.sin(th)*0.72*w*(Math.sin(th)>0?1.12:1)];};
        for(let lev=0;lev<14;lev++){const rr=18+lev*(m?26:34)+lev*lev*0.6;let d='';for(let a=0;a<=96;a++){const th=a/96*Math.PI*2,[ux,uy]=shp(th);const x=bx+ux*rr,y=by+uy*rr;d+=(a?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);}const major=lev%4===0;p+='<path d="'+d+'Z" fill="none" stroke="'+ink+(major?0.12:0.065)+')" stroke-width="'+(major?1.5:1)+'"/>';
          if(major&&lev>0)p+='<text x="'+(bx+rr*spanR*1.6+4).toFixed(0)+'" y="'+(by+4)+'" font-family="sans-serif" font-size="10" font-weight="700" fill="'+ink+'0.2)">'+Math.max(0,mx-lev*4)+'</text>';}
        p+='<path d="M'+bx+' '+(by-7)+'l6 10h-12z" fill="'+ink+'0.22)"/><text x="'+(bx+10)+'" y="'+(by-4)+'" font-family="sans-serif" font-size="12" font-weight="800" fill="'+ink+'0.26)">'+mx+'</text>';
        const ox=m?60:W-330,oy=m?H-270:H-250,cell=m?22:26,cols=10,rows=7;if(!m){p+='<g transform="rotate(-7 '+(ox+cols*cell/2)+' '+(oy+rows*cell/2)+')">';
                for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const h=Math.sin(r*3.1+c*1.7)*0.5+0.5;if(h<0.2)continue;if(r>4&&c<3)continue;if(c===5||r===3)continue;const x=ox+c*cell,y=oy+r*cell;p+='<rect x="'+(x+3)+'" y="'+(y+3)+'" width="'+(cell-6)+'" height="'+(cell-6)+'" rx="2" fill="'+ink+(0.035+h*0.06).toFixed(3)+')"/>';}
        p+='<rect x="'+(ox+6*cell+3)+'" y="'+(oy+1*cell+3)+'" width="'+(cell*2-6)+'" height="'+(cell*2-6)+'" rx="4" fill="rgba(120,180,110,0.18)"/>';
        p+='<circle cx="'+(ox+2*cell+cell/2)+'" cy="'+(oy+2*cell+cell/2)+'" r="5" fill="rgba(232,96,76,0.45)"/><circle cx="'+(ox+2*cell+cell/2)+'" cy="'+(oy+2*cell+cell/2)+'" r="12" fill="none" stroke="rgba(232,96,76,0.28)" stroke-width="1.5"/>';
        p+='<text x="'+ox+'" y="'+(oy-12)+'" font-family="sans-serif" font-size="12" font-weight="800" letter-spacing="2.5" fill="'+ink+'0.24)">'+CITY.toUpperCase()+'</text></g>';
        p+='<line x1="'+(bx)+'" y1="'+(by)+'" x2="'+(ox+cols*cell*0.45)+'" y2="'+(oy+cell)+'" stroke="'+ink+'0.12)" stroke-width="1.3" stroke-dasharray="3 6"/>';}
        const nx=m?W-50:W-110,ny=m?70:80;p+='<g transform="translate('+nx+' '+ny+')" fill="none" stroke="'+ink+'0.2)" stroke-width="1.3"><circle r="18"/><path d="M0 -26v52M-26 0h52"/><path d="M0 -16l5 16h-10z" fill="'+ink+'0.2)"/></g><text x="'+(nx-4)+'" y="'+(ny-30)+'" font-family="sans-serif" font-size="11" font-weight="800" fill="'+ink+'0.24)">N</text>';
        return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid slice">'+p+'</svg>');}),topoOp:m?0.45:1,cBg:'#fffcf6',cTint:({sunny:'#fdefc8',partly:'#e3eef8',sunset:'#fbdcc8',heat:'#fde2c4',overcast:'#e7e9ee',rain:'#dde3ec',snow:'#e8eef6',night:'#e2e2f2'})[cond]||'#f3ede1',cFg:'#27233a',cMuted:'#4a4558',cBorder:'rgba(31,27,46,0.06)',cTrack:'rgba(39,35,58,0.12)',
      aL,aT,aW,aH,aCx,shL:aCx-(sitting?16:12)*aS,shT:groundY-2*aS,shW:(sitting?32:24)*aS,shH:aS*3,
      handX:aL+30*aS,handY:aT+8*aS,mouthX:aL+20*aS,mouthY:aT+18.5*aS,headX:aL+20*aS,headY:aT+13*aS,
      dSx,dBy,dK,hBy,vwN:vw,tempF:P.temp,windDir:P.dir,s0a:signs[0].a,s0b:signs[0].b,s1a:signs[1].a,s1b:signs[1].b,s2a:signs[2].a,s2b:signs[2].b,
      shirtIcon:icon('shirt'),score:P.score,label:P.label,scoreTint:TINT[band(P.score)],wear:fit.wear,avatarSrc,
      pieces:dressList.map((p,i)=>({...p,op:i<st.dressStep?1:0,tf:i<st.dressStep?'none':'translateX(16px) scale(0.92)'})),
      pieceLabW:m?132:190,
      hasFelt:savedOk,feltNote:savedOk?'felt '+['miserable','meh','okay','good','perfect'][band(st.felt)]:'',
      ctaLabel:savedOk?'edit tonight’s check-in':'how did today feel?',ctaBg:m?'#fbf3e2':'rgba(31,27,46,0.08)',ctaFg:m?'#2e1a0c':'#27233a',
      graphSrc:G.src,gH,gBoxH:gH+16,bestLabel:'Best at '+hr(best),
      showBestMark:sel!==best,bestMark:icon('best'),bestPct:(best+0.5)/12*100,
      tipPct:(sel+0.5)/12*100,tipTop,tipTx,tipBg:TINT[band(P.curve[sel])],tipLabel:(sel===best?'Best · ':'')+(sel===0?'Now':hr(sel))+' · '+P.curve[sel],
      hits:P.curve.map((_,i)=>({onClick:()=>this.setState({hourSel:i})})),
      xLabels:[0,3,6,9,11].map(i=>({t:i===0?'Now':hrs(i),pct:(i+0.5)/12*100,tx:i===0?'-30%':i===11?'-70%':'-50%'})),
      feltV,onSlide,feltNumColor:st.felt!=null?STRONG[band(feltV)]:INK,labelLow:P.label.toLowerCase(),
      feels:['miserable','meh','okay','good','perfect'].map((l,i)=>({label:l,src:face(i),said:i===band(P.score),tf:st.felt!=null&&band(st.felt)===i?'translateY(-4px) rotate(-2deg)':'none',bg:st.felt!=null&&band(st.felt)===i?TINT[i]:'#f3e6c8',sh:st.felt!=null&&band(st.felt)===i?'inset 0 0 0 2px '+INK:'inset 0 0 0 1px rgba(31,27,46,0.1)',onClick:()=>this.setState({felt:[20,47,62,78,93][i],saved:false})})),
      feltLine:'',rPad:m?'12px 12px 16px':'14px 18px 18px',rGap:m?4:8,rTilePad:m?'10px 0 8px':'10px 2px 8px',rImg:m?26:30,rLab:m?10:11,woodTex:woodTex(),feltTint:TINT[band(feltV)],
      deltaLabel:st.felt==null?'drag the dot':delta===0?'spot on':(delta>0?'+':'−')+Math.abs(delta)+(m?'':' vs forecast'),
      fitFs:m?11:13,fitHint:st.rateFit?fitHints[st.rateFit]:'',
      fits:[['too cold','#9fc3e8'],['just right','#aee0c6'],['too warm','#f6c0b4']].map(([l,c])=>({label:l,bg:st.rateFit===l?c:'#f3e6c8',fg:'#27233a',tf:st.rateFit===l?'translateY(-3px)':'none',onClick:()=>this.setState({rateFit:l,saved:false})})),
      onSave:()=>{if(st.felt==null||st.saving)return;const done=()=>{this.setState({saved:true,saving:false,saveErr:''});clearTimeout(this._to);this._to=setTimeout(()=>this.closeRateAnim(),1100);};
        if(!this.props.onCheckin){done();return;}this.setState({saving:true,saveErr:''});Promise.resolve(this.props.onCheckin({felt:st.felt,fit:st.rateFit})).then(done,e=>this.setState({saving:false,saveErr:(e&&e.message)||'couldn’t save'}));},
      saveLabel:st.saved?'saved. see you tomorrow':st.saving?'saving…':st.saveErr||'save check-in',saveBg:st.saved?STRONG[4]:st.saveErr?STRONG[0]:INK,saveFg:'#fbf6ec',saveOp:st.felt==null?0.4:1,
      dots:PAIRS.map((_,i)=>({bg:i<st.obStep?INK:i===st.obStep?STRONG[2]:'rgba(31,27,46,0.12)'})),
      stepLabel:st.obStep>=8?'Done':(st.obStep+1)+' of 8',obDone:st.obStep>=8,obNotDone:st.obStep<8,
      aCond:pair[0][0],bCond:pair[1][0],aWind:pair[0][2],bWind:pair[1][2],aSeed:step*2+2,bSeed:step*2+1,
      aStats:obStats(pair[0]),bStats:obStats(pair[1]),aSh:cardSh('A'),bSh:cardSh('B'),aTf:st.obPick==='A'?'translateY(-4px)':'none',bTf:st.obPick==='B'?'translateY(-4px)':'none',
      onA:()=>pick('A'),onB:()=>pick('B'),onSame:()=>{if(!st.obPick)this.setState(s=>({obStep:s.obStep+1}));},
      onSkip:()=>this.setState({obStep:8}),doneSprite:sprite(outfitFor(70,'partly',5).o,'happy','stand'),
    };
  }
}

export { Component, PRESETS, PORDER, INTDEF, outfitFor, wearOf, drawScene, sprite, itemSprite, setAvatar, nameOf, SKINS, HAIRC, HAIRS, STYLES, AV_DEFAULT };
