(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const c of document.querySelectorAll('link[rel="modulepreload"]'))L(c);new MutationObserver(c=>{for(const d of c)if(d.type==="childList")for(const T of d.addedNodes)T.tagName==="LINK"&&T.rel==="modulepreload"&&L(T)}).observe(document,{childList:!0,subtree:!0});function C(c){const d={};return c.integrity&&(d.integrity=c.integrity),c.referrerPolicy&&(d.referrerPolicy=c.referrerPolicy),c.crossOrigin==="use-credentials"?d.credentials="include":c.crossOrigin==="anonymous"?d.credentials="omit":d.credentials="same-origin",d}function L(c){if(c.ep)return;c.ep=!0;const d=C(c);fetch(c.href,d)}})();window.onload=function(){const s=document.getElementById("viewport"),o=s.getContext("2d");function C(){s.width=window.innerWidth,s.height=window.innerHeight,i.x=s.width*.1,i.y=s.height*.1,i.tilewidth=s.width*.8/i.columns,i.tileheight=s.height*.8/i.rows,p[0].x=s.width*.05,p[0].y=s.height*.05,p[1].x=s.width*.05,p[1].y=s.height*.1,p[2].x=s.width*.05,p[2].y=s.height*.15,N=s.width*.05,V=s.height*.02}window.addEventListener("resize",C);let L=0,c=0,d=0,T=0,R=!1;const i={x:250,y:113,columns:8,rows:8,tilewidth:40,tileheight:40,tiles:[],selectedtile:{selected:!1,column:0,row:0}},O=[[255,128,128],[128,255,128],[128,128,255],[255,255,128],[255,128,255],[128,255,255],[255,255,255]];let h=[],x=[],r={column1:0,row1:0,column2:0,row2:0};const w={init:0,ready:1,resolve:2};let m=w.init,I=0,a=0,u=0;const y=.3;let B=!1,z=!1,P=!1;const p=[{x:30,y:240,width:150,height:50,text:"New Game"},{x:30,y:300,width:150,height:50,text:"Show Moves"},{x:30,y:360,width:150,height:50,text:"Enable AI Bot"}];function W(){s.addEventListener("mousemove",se),s.addEventListener("mousedown",re),s.addEventListener("mouseup",fe),s.addEventListener("mouseout",ce);for(let e=0;e<i.columns;e++){i.tiles[e]=[];for(let t=0;t<i.rows;t++)i.tiles[e][t]={type:0,shift:0}}D(),$(0)}function $(e){window.requestAnimationFrame($),J(e),_()}function J(e){const t=(e-L)/1e3;if(L=e,Q(t),m===w.ready){if(x.length<=0&&(P=!0),z&&(u+=t,u>y)){if(j(),x.length>0){const l=x[Math.floor(Math.random()*x.length)];G(l.column1,l.row1,l.column2,l.row2)}u=0}}else if(m===w.resolve){if(u+=t,a===0){if(u>y){if(g(),h.length>0){for(const l of h)I+=100*(l.length-2);q(),a=1}else m=w.ready;u=0}}else a===1?u>y&&(X(),a=0,u=0,g(),h.length<=0&&(m=w.ready)):a===2?u>y&&(S(r.column1,r.row1,r.column2,r.row2),g(),h.length>0?(a=0,u=0,m=w.resolve):(a=3,u=0),j(),g()):a===3&&u>y&&(S(r.column1,r.row1,r.column2,r.row2),m=w.ready);j(),g()}}function Q(e){c>.25&&(T=Math.round(d/c),c=0,d=0),c+=e,d++}function F(e,t,l,n){const f=o.measureText(e);o.fillText(e,t+(n-f.width)/2,l)}function Z(){o.fillStyle="#d0d0d0",o.fillRect(0,0,s.width,s.height),o.fillStyle="#e8eaec",o.fillRect(1,1,s.width-2,s.height-2),o.fillStyle="#303030",o.fillRect(0,0,s.width,65),o.fillStyle="#ffffff",o.font="24px Verdana",o.fillText("Match3 Example - Rembound.com",10,30),o.fillStyle="#ffffff",o.font="12px Verdana",o.fillText(`Fps: ${T}`,13,50)}let N=30,V=40;function _(){Z(),o.fillStyle="#000000",o.font="24px Verdana",F("Score:",N,V,150),F(I.toString(),N,V+30,150),k();const e=i.columns*i.tilewidth,t=i.rows*i.tileheight;o.fillStyle="#000000",o.fillRect(i.x-4,i.y-4,e+8,t+8),ee(),te(),B&&h.length<=0&&m===w.ready&&le(),P&&(o.fillStyle="rgba(0, 0, 0, 0.8)",o.fillRect(i.x,i.y,e,t),o.fillStyle="#ffffff",o.font="24px Verdana",F("Game Over!",i.x,i.y+t/2+10,e))}function k(){for(const e of p){o.fillStyle="#000000",o.fillRect(e.x,e.y,e.width,e.height),o.fillStyle="#ffffff",o.font="18px Verdana";const t=o.measureText(e.text);o.fillText(e.text,e.x+(e.width-t.width)/2,e.y+30)}}function ee(){for(let e=0;e<i.columns;e++)for(let t=0;t<i.rows;t++){const l=i.tiles[e][t].shift,n=v(e,t,0,u/y*l);if(i.tiles[e][t].type>=0){const f=O[i.tiles[e][t].type];M(n.tilex,n.tiley,f[0],f[1],f[2])}i.selectedtile.selected&&i.selectedtile.column===e&&i.selectedtile.row===t&&M(n.tilex,n.tiley,255,0,0)}if(m===w.resolve&&(a===2||a===3)){const e=r.column2-r.column1,t=r.row2-r.row1,l=v(r.column1,r.row1,0,0),n=v(r.column1,r.row1,u/y*e,u/y*t),f=O[i.tiles[r.column1][r.row1].type],b=v(r.column2,r.row2,0,0),A=v(r.column2,r.row2,u/y*-e,u/y*-t),E=O[i.tiles[r.column2][r.row2].type];M(l.tilex,l.tiley,0,0,0),M(b.tilex,b.tiley,0,0,0),a===2?(M(n.tilex,n.tiley,f[0],f[1],f[2]),M(A.tilex,A.tiley,E[0],E[1],E[2])):(M(A.tilex,A.tiley,E[0],E[1],E[2]),M(n.tilex,n.tiley,f[0],f[1],f[2]))}}function v(e,t,l,n){const f=i.x+(e+l)*i.tilewidth,b=i.y+(t+n)*i.tileheight;return{tilex:f,tiley:b}}function M(e,t,l,n,f){o.fillStyle=`rgb(${l},${n},${f})`,o.fillRect(e+2,t+2,i.tilewidth-4,i.tileheight-4)}function te(){for(const e of h){const t=v(e.column,e.row,0,0);e.horizontal?(o.fillStyle="#00ff00",o.fillRect(t.tilex+i.tilewidth/2,t.tiley+i.tileheight/2-4,(e.length-1)*i.tilewidth,8)):(o.fillStyle="#0000ff",o.fillRect(t.tilex+i.tilewidth/2-4,t.tiley+i.tileheight/2,8,(e.length-1)*i.tileheight))}}function le(){for(const e of x){const t=v(e.column1,e.row1,0,0),l=v(e.column2,e.row2,0,0);o.strokeStyle="#ff0000",o.beginPath(),o.moveTo(t.tilex+i.tilewidth/2,t.tiley+i.tileheight/2),o.lineTo(l.tilex+i.tilewidth/2,l.tiley+i.tileheight/2),o.stroke()}}function D(){I=0,m=w.ready,P=!1,ie(),j(),g()}function ie(){let e=!1;for(;!e;){for(let t=0;t<i.columns;t++)for(let l=0;l<i.rows;l++)i.tiles[t][l].type=H();oe(),j(),x.length>0&&(e=!0)}}function H(){return Math.floor(Math.random()*O.length)}function oe(){for(g();h.length>0;)q(),X(),g()}function g(){h=[];for(let e=0;e<i.rows;e++){let t=1;for(let l=0;l<i.columns;l++){let n=!1;l===i.columns-1?n=!0:i.tiles[l][e].type===i.tiles[l+1][e].type&&i.tiles[l][e].type!==-1?t+=1:n=!0,n&&(t>=3&&h.push({column:l+1-t,row:e,length:t,horizontal:!0}),t=1)}}for(let e=0;e<i.columns;e++){let t=1;for(let l=0;l<i.rows;l++){let n=!1;l===i.rows-1?n=!0:i.tiles[e][l].type===i.tiles[e][l+1].type&&i.tiles[e][l].type!==-1?t+=1:n=!0,n&&(t>=3&&h.push({column:e,row:l+1-t,length:t,horizontal:!1}),t=1)}}}function j(){x=[];for(let e=0;e<i.rows;e++)for(let t=0;t<i.columns-1;t++)S(t,e,t+1,e),g(),S(t,e,t+1,e),h.length>0&&x.push({column1:t,row1:e,column2:t+1,row2:e});for(let e=0;e<i.columns;e++)for(let t=0;t<i.rows-1;t++)S(e,t,e,t+1),g(),S(e,t,e,t+1),h.length>0&&x.push({column1:e,row1:t,column2:e,row2:t+1});h=[]}function ne(e){for(let t=0;t<h.length;t++){const l=h[t];let n=0,f=0;for(let b=0;b<l.length;b++)e(t,l.column+n,l.row+f,l),l.horizontal?n++:f++}}function q(){ne((e,t,l,n)=>{console.info(e),console.info(n),i.tiles[t][l].type=-1});for(let e=0;e<i.columns;e++){let t=0;for(let l=i.rows-1;l>=0;l--)i.tiles[e][l].type===-1?(t++,i.tiles[e][l].shift=0):i.tiles[e][l].shift=t}}function X(){for(let e=0;e<i.columns;e++)for(let t=i.rows-1;t>=0;t--){if(i.tiles[e][t].type===-1)i.tiles[e][t].type=H();else{const l=i.tiles[e][t].shift;l>0&&S(e,t,e,t+l)}i.tiles[e][t].shift=0}}function Y(e){const t=Math.floor((e.x-i.x)/i.tilewidth),l=Math.floor((e.y-i.y)/i.tileheight);return t>=0&&t<i.columns&&l>=0&&l<i.rows?{valid:!0,x:t,y:l}:{valid:!1,x:0,y:0}}function K(e,t,l,n){return Math.abs(e-l)===1&&t===n||Math.abs(t-n)===1&&e===l}function S(e,t,l,n){const f=i.tiles[e][t].type;i.tiles[e][t].type=i.tiles[l][n].type,i.tiles[l][n].type=f}function G(e,t,l,n){r={column1:e,row1:t,column2:l,row2:n},i.selectedtile.selected=!1,a=2,u=0,m=w.resolve}function se(e){const t=U(s,e);if(R&&i.selectedtile.selected){const l=Y(t);l.valid&&K(l.x,l.y,i.selectedtile.column,i.selectedtile.row)&&G(l.x,l.y,i.selectedtile.column,i.selectedtile.row)}}function re(e){const t=U(s,e);if(!R){const l=Y(t);if(l.valid){let n=!1;if(i.selectedtile.selected)if(l.x===i.selectedtile.column&&l.y===i.selectedtile.row){i.selectedtile.selected=!1,R=!0;return}else K(l.x,l.y,i.selectedtile.column,i.selectedtile.row)&&(G(l.x,l.y,i.selectedtile.column,i.selectedtile.row),n=!0);n||(i.selectedtile.column=l.x,i.selectedtile.row=l.y,i.selectedtile.selected=!0)}else i.selectedtile.selected=!1;R=!0}for(const l of p)t.x>=l.x&&t.x<l.x+l.width&&t.y>=l.y&&t.y<l.y+l.height&&(l.text==="New Game"?D():l.text.includes("Show Moves")||l.text.includes("Hide Moves")?(B=!B,l.text=(B?"Hide":"Show")+" Moves"):(l.text.includes("Enable AI Bot")||l.text.includes("Disable AI Bot"))&&(z=!z,l.text=(z?"Disable":"Enable")+" AI Bot"))}function fe(e){console.info(e),R=!1}function ce(e){console.info(e),R=!1}function U(e,t){const l=e.getBoundingClientRect();return{x:Math.round((t.clientX-l.left)/(l.right-l.left)*e.width),y:Math.round((t.clientY-l.top)/(l.bottom-l.top)*e.height)}}W(),C()};
