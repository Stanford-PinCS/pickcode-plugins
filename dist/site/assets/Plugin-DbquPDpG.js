var ye=Object.defineProperty;var le=e=>{throw TypeError(e)};var ve=(e,n,t)=>n in e?ye(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var O=(e,n,t)=>ve(e,typeof n!="symbol"?n+"":n,t),ce=(e,n,t)=>n.has(e)||le("Cannot "+t);var J=(e,n,t)=>(ce(e,n,"read from private field"),t?t.call(e):n.get(e)),Q=(e,n,t)=>n.has(e)?le("Cannot add the same private member more than once"):n instanceof WeakSet?n.add(e):n.set(e,t),W=(e,n,t,i)=>(ce(e,n,"write to private field"),i?i.call(e,t):n.set(e,t),t);import{o as we,a as Z,b as se,p as ke}from"./index-D3ky8DnH.js";import{n as L,r as N,j as ee}from"./index-BnTeTTVc.js";function ue(e,n){var t=typeof Symbol=="function"&&e[Symbol.iterator];if(!t)return e;var i,v,B=t.call(e),k=[];try{for(;(n===void 0||n-- >0)&&!(i=B.next()).done;)k.push(i.value)}catch(_){v={error:_}}finally{try{i&&!i.done&&(t=B.return)&&t.call(B)}finally{if(v)throw v.error}}return k}var xe=function(e){var n=e.children;return L.createElement("div",{className:"react-terminal-line"},n)};(function(e,n){n===void 0&&(n={});var t=n.insertAt;if(typeof document<"u"){var i=document.head||document.getElementsByTagName("head")[0],v=document.createElement("style");v.type="text/css",t==="top"&&i.firstChild?i.insertBefore(v,i.firstChild):i.appendChild(v),v.styleSheet?v.styleSheet.cssText=e:v.appendChild(document.createTextNode(e))}})(`/**
 * Modfied version of [termynal.js](https://github.com/ines/termynal/blob/master/termynal.css).
 *
 * @author Ines Montani <ines@ines.io>
 * @version 0.0.1
 * @license MIT
 */
 .react-terminal-wrapper {
  width: 100%;
  background: #252a33;
  color: #eee;
  font-size: 18px;
  font-family: 'Fira Mono', Consolas, Menlo, Monaco, 'Courier New', Courier, monospace;
  border-radius: 4px;
  padding: 75px 45px 35px;
  position: relative;
  -webkit-box-sizing: border-box;
          box-sizing: border-box;
 }

.react-terminal {
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.react-terminal-wrapper.react-terminal-light {
  background: #ddd;
  color: #1a1e24;
}

.react-terminal-window-buttons {
  position: absolute;
  top: 15px;
  left: 15px;
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.react-terminal-window-buttons button {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 0;
}

.react-terminal-window-buttons button.clickable {
  cursor: pointer;
}

.react-terminal-window-buttons button.red-btn {
  background: #d9515d;
}

.react-terminal-window-buttons button.yellow-btn {
  background: #f4c025;
}

.react-terminal-window-buttons button.green-btn {
  background: #3ec930;
}

.react-terminal-wrapper:after {
  content: attr(data-terminal-name);
  position: absolute;
  color: #a2a2a2;
  top: 5px;
  left: 0;
  width: 100%;
  text-align: center;
  pointer-events: none;
}

.react-terminal-wrapper.react-terminal-light:after {
  color: #D76D77;
}

.react-terminal-line {
  white-space: pre;
}

.react-terminal-line:before {
  /* Set up defaults and ensure empty lines are displayed. */
  content: '';
  display: inline-block;
  vertical-align: middle;
  color: #a2a2a2;
}

.react-terminal-light .react-terminal-line:before {
  color: #D76D77;
}

.react-terminal-input:before {
  margin-right: 0.75em;
  content: '$';
}

.react-terminal-input[data-terminal-prompt]:before {
  content: attr(data-terminal-prompt);
}

.react-terminal-wrapper:focus-within .react-terminal-active-input .cursor {
  position: relative;
  display: inline-block;
  width: 0.55em;
  height: 1em;
  top: 0.225em;
  background: #fff;
  -webkit-animation: blink 1s infinite;
          animation: blink 1s infinite;
}

/* Cursor animation */

@-webkit-keyframes blink {
  50% {
      opacity: 0;
  }
}

@keyframes blink {
  50% {
      opacity: 0;
  }
}

.terminal-hidden-input {
    position: fixed;
    left: -1000px;
}

/* .react-terminal-progress {
  display: flex;
  margin: .5rem 0;
}

.react-terminal-progress-bar {
  background-color: #fff;
  border-radius: .25rem;
  width: 25%;
}

.react-terminal-wrapper.react-terminal-light .react-terminal-progress-bar {
  background-color: #000;
} */
`);var X,Ee=function(e){var n=e.redBtnCallback,t=e.yellowBtnCallback,i=e.greenBtnCallback;return L.createElement("div",{className:"react-terminal-window-buttons"},L.createElement("button",{className:"".concat(t?"clickable":""," red-btn"),disabled:!n,onClick:n}),L.createElement("button",{className:"".concat(t?"clickable":""," yellow-btn"),disabled:!t,onClick:t}),L.createElement("button",{className:"".concat(i?"clickable":""," green-btn"),disabled:!i,onClick:i}))};(function(e){e[e.Light=0]="Light",e[e.Dark=1]="Dark"})(X||(X={}));var Ce=function(e){var n=e.name,t=e.prompt,i=e.height,v=i===void 0?"600px":i,B=e.colorMode,k=e.onInput,_=e.children,D=e.startingInputValue,F=D===void 0?"":D,V=e.redBtnCallback,$=e.yellowBtnCallback,A=e.greenBtnCallback,q=e.TopButtonsPanel,c=q===void 0?Ee:q,h=ue(N.useState(""),2),a=h[0],u=h[1],p=ue(N.useState(0),2),I=p[0],M=p[1],S=N.useRef(null);N.useEffect(function(){u(F.trim())},[F]),N.useEffect(function(){var s,m;if(k!=null){var f=[],b=function(r){var g=function(){var d;return(d=r==null?void 0:r.querySelector(".terminal-hidden-input"))===null||d===void 0?void 0:d.focus()};r==null||r.addEventListener("click",g),f.push({terminalEl:r,listener:g})};try{for(var w=function(r){var g=typeof Symbol=="function"&&Symbol.iterator,d=g&&r[g],o=0;if(d)return d.call(r);if(r&&typeof r.length=="number")return{next:function(){return r&&o>=r.length&&(r=void 0),{value:r&&r[o++],done:!r}}};throw new TypeError(g?"Object is not iterable.":"Symbol.iterator is not defined.")}(document.getElementsByClassName("react-terminal-wrapper")),l=w.next();!l.done;l=w.next())b(l.value)}catch(r){s={error:r}}finally{try{l&&!l.done&&(m=w.return)&&m.call(w)}finally{if(s)throw s.error}}return function(){f.forEach(function(r){r.terminalEl.removeEventListener("click",r.listener)})}}},[k]);var j=["react-terminal-wrapper"];return B===X.Light&&j.push("react-terminal-light"),L.createElement("div",{className:j.join(" "),"data-terminal-name":n},L.createElement(c,{redBtnCallback:V,yellowBtnCallback:$,greenBtnCallback:A}),L.createElement("div",{className:"react-terminal",style:{height:v}},_,typeof k=="function"&&L.createElement("div",{className:"react-terminal-line react-terminal-input react-terminal-active-input","data-terminal-prompt":t||"$",key:"terminal-line-prompt"},a,L.createElement("span",{className:"cursor",style:{left:"".concat(I+1,"px")}})),L.createElement("div",{ref:S})),L.createElement("input",{className:"terminal-hidden-input",placeholder:"Terminal Hidden Input",value:a,autoFocus:k!=null,onChange:function(s){u(s.target.value)},onKeyDown:function(s){var m,f,b;if(k){if(s.key==="Enter")k(a),M(0),u(""),setTimeout(function(){var d;return(d=S==null?void 0:S.current)===null||d===void 0?void 0:d.scrollIntoView({behavior:"auto",block:"nearest"})},500);else if(["ArrowLeft","ArrowRight","ArrowDown","ArrowUp","Delete"].includes(s.key)){var w=s.currentTarget,l="",r=a.length-(w.selectionStart||0);m=r,f=0,b=a.length,r=m>b?b:m<f?f:m,s.key==="ArrowLeft"?(r>a.length-1&&r--,l=a.slice(a.length-1-r)):s.key==="ArrowRight"||s.key==="Delete"?l=a.slice(a.length-r+1):s.key==="ArrowUp"&&(l=a.slice(0));var g=function(d,o){var y=document.createElement("span");y.style.visibility="hidden",y.style.position="absolute",y.style.fontSize=window.getComputedStyle(d).fontSize,y.style.fontFamily=window.getComputedStyle(d).fontFamily,y.innerText=o,document.body.appendChild(y);var E=y.getBoundingClientRect().width;return document.body.removeChild(y),-E}(w,l);M(g)}}}}))};const Le=we(({state:e})=>{const[n,t]=N.useState([]);return N.useEffect(()=>{e!=null&&e.terminalLineData&&t(e.terminalLineData.map((i,v)=>ee.jsx(xe,{children:ee.jsx("span",{className:i.error?"text-red-500":"",children:i.line})},v+"#"+i.line)))},[e==null?void 0:e.terminalLineData.length]),ee.jsx(Ce,{name:"Console",colorMode:X.Dark,prompt:(e==null?void 0:e.inputMessage)??"---",height:"100%",onInput:i=>{e&&e.waitingForInput&&(e.addLine(e.inputMessage+" "+i),e.sendUserInput(i),e.waitingForInput=!1,e.inputMessage="---")},TopButtonsPanel:()=>null,children:n})});let de,pe,me,fe,he,be;function Se(e,n,t,i,v,B){function k(c,h,a){return function(u,p){return a&&a(u),c[h].call(u,p)}}function _(c,h){for(var a=0;a<c.length;a++)c[a].call(h);return h}function D(c,h,a,u){if(typeof c!="function"&&(u||c!==void 0))throw new TypeError(h+" must "+(a||"be")+" a function"+(u?"":" or undefined"));return c}function F(c,h,a,u,p,I,M,S,j,s,m,f,b){function w(x){if(!b(x))throw new TypeError("Attempted to access private element on non-instance")}var l,r=h[0],g=h[3],d=!S;if(!d){a||Array.isArray(r)||(r=[r]);var o={},y=[],E=p===3?"get":p===4||f?"set":"value";s?(m||f?o={get:ge(function(){return g(this)},u,"get"),set:function(x){h[4](this,x)}}:o[E]=g,m||ge(o[E],u,p===2?"":E)):m||(o=Object.getOwnPropertyDescriptor(c,u))}for(var C=c,P=r.length-1;P>=0;P-=a?2:1){var re=r[P],ie=a?r[P-1]:void 0,ae={},z={kind:["field","accessor","method","getter","setter","class"][p],name:u,metadata:I,addInitializer:(function(x,T){if(x.v)throw Error("attempted to call addInitializer after decoration was finished");D(T,"An initializer","be",!0),M.push(T)}).bind(null,ae)};try{if(d)(l=D(re.call(ie,C,z),"class decorators","return"))&&(C=l);else{var R,G;z.static=j,z.private=s,s?p===2?R=function(x){return w(x),o.value}:(p<4&&(R=k(o,"get",w)),p!==3&&(G=k(o,"set",w))):(R=function(x){return x[u]},(p<2||p===4)&&(G=function(x,T){x[u]=T}));var oe=z.access={has:s?b.bind():function(x){return u in x}};if(R&&(oe.get=R),G&&(oe.set=G),C=re.call(ie,f?{get:o.get,set:o.set}:o[E],z),f){if(typeof C=="object"&&C)(l=D(C.get,"accessor.get"))&&(o.get=l),(l=D(C.set,"accessor.set"))&&(o.set=l),(l=D(C.init,"accessor.init"))&&y.push(l);else if(C!==void 0)throw new TypeError("accessor decorators must return an object with get, set, or init properties or void 0")}else D(C,(m?"field":"method")+" decorators","return")&&(m?y.push(C):o[E]=C)}}finally{ae.v=!0}}return(m||f)&&S.push(function(x,T){for(var Y=y.length-1;Y>=0;Y--)T=y[Y].call(x,T);return T}),m||d||(s?f?S.push(k(o,"get"),k(o,"set")):S.push(p===2?o[E]:k.call.bind(o[E])):Object.defineProperty(c,u,o)),C}function V(c,h){return Object.defineProperty(c,Symbol.metadata||Symbol.for("Symbol.metadata"),{configurable:!0,enumerable:!0,value:h})}if(arguments.length>=6)var $=B[Symbol.metadata||Symbol.for("Symbol.metadata")];var A=Object.create($??null),q=function(c,h,a,u){var p,I,M=[],S=function(E){return Te(E)===c},j=new Map;function s(E){E&&M.push(_.bind(null,E))}for(var m=0;m<h.length;m++){var f=h[m];if(Array.isArray(f)){var b=f[1],w=f[2],l=f.length>3,r=16&b,g=!!(8&b),d=(b&=7)==0,o=w+"/"+g;if(!d&&!l){var y=j.get(o);if(y===!0||y===3&&b!==4||y===4&&b!==3)throw Error("Attempted to decorate a public method/accessor that has the same name as a previously decorated public method/accessor. This is not currently supported by the decorators plugin. Property name was: "+w);j.set(o,!(b>2)||b)}F(g?c:c.prototype,f,r,l?"#"+w:De(w),b,u,g?I=I||[]:p=p||[],M,g,l,d,b===1,g&&l?S:a)}}return s(p),s(I),M}(e,n,v,A);return t.length||V(e,A),{e:q,get c(){var c=[];return t.length&&[V(F(e,[t],i,e.name,5,A,c),A),_.bind(null,c,e)]}}}function De(e){var n=Me(e,"string");return typeof n=="symbol"?n:n+""}function Me(e,n){if(typeof e!="object"||!e)return e;var t=e[Symbol.toPrimitive];if(t!==void 0){var i=t.call(e,n);if(typeof i!="object")return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(e)}function ge(e,n,t){typeof n=="symbol"&&(n=(n=n.description)?"["+n+"]":"");try{Object.defineProperty(e,"name",{configurable:!0,value:t?t+" "+n:n})}catch{}return e}function Te(e){if(Object(e)!==e)throw TypeError("right-hand side of 'in' should be an object, got "+(e!==null?typeof e:"null"));return e}var U,H,K;const te=class te{constructor(){Q(this,U,(de(this),pe(this,[])));Q(this,H,me(this,"---"));Q(this,K,fe(this,!1));O(this,"sendMessage",n=>{});O(this,"init",n=>{this.sendMessage=n});O(this,"onMessage",he(this,n=>{if("output"in n)this.addLine(n.output);else if("input"in n){let t=n.input.split(`
`);for(let i=0;i<t.length-1;i++)this.addLine(t[i]);this.inputMessage=t[t.length-1]||">",this.waitingForInput=!0}else this.addLine(n.error,!0)}));O(this,"onLog",be(this,({logType:n,message:t})=>{n=="error"?this.addLine(t,!0):this.addLine(t)}))}get terminalLineData(){return J(this,U)}set terminalLineData(n){W(this,U,n)}get inputMessage(){return J(this,H)}set inputMessage(n){W(this,H,n)}get waitingForInput(){return J(this,K)}set waitingForInput(n){W(this,K,n)}addLine(n,t=!1){this.terminalLineData=[...this.terminalLineData,{line:n,error:t}]}sendUserInput(n){this.sendMessage({input:n})}};U=new WeakMap,H=new WeakMap,K=new WeakMap,[pe,me,fe,he,be,de]=Se(te,[[Z,1,"terminalLineData"],[Z,1,"inputMessage"],[Z,1,"waitingForInput"],[se,0,"onMessage"],[se,0,"onLog"]],[]).e;let ne=te;const Ne=ke(Le,ne);export{Ne as Plugin,Ne as default};
