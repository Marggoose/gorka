function initWave(canvas, reverse = false) {
    const ctx = canvas.getContext('2d');
    const colors = ['#DAEAFF','#A1C6F6','#499BED','#022E5B','#031725'];
    let t = 0;

    function resize() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function lerp(a,b,t){ return a+(b-a)*t }
    function hex(c){ return parseInt(c,16) }

    function mix(c1,c2,t){
        return `rgb(
            ${lerp(hex(c1.slice(1,3)),hex(c2.slice(1,3)),t)},
            ${lerp(hex(c1.slice(3,5)),hex(c2.slice(3,5)),t)},
            ${lerp(hex(c1.slice(5)),hex(c2.slice(5)),t)}
        )`;
    }

    function draw(){
        t += 0.003;
        const g = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
        colors.forEach((c,i)=>{
            const shift = (Math.sin(t + i)+1)/2;
            g.addColorStop(i/(colors.length-1), mix(c, colors[(i+1)%colors.length], shift));
        });

        ctx.fillStyle = g;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        requestAnimationFrame(draw);
    }
    draw();
}

window.addEventListener('load', ()=>{
    initWave(document.getElementById('headerCanvas'));
    initWave(document.getElementById('footerCanvas'), true);
});
