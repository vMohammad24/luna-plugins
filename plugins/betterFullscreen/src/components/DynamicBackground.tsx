import React, { memo, useEffect, useRef } from 'react';
import { Color, SongData } from '../types';

interface DynamicBackgroundProps {
    songData: SongData | undefined;
    colors: Color[];
    isPlaying: boolean;
    currentTimeRef: React.MutableRefObject<number>;
    albumArt: string;
}

const VERTEX_SHADER = `
    attribute vec2 position;
    varying vec2 v_uv;
    void main() {
        v_uv = position * 0.5 + 0.5;
        v_uv.y = 1.0 - v_uv.y;
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

const FRAGMENT_SHADER = `
    precision highp float;

    varying vec2 v_uv;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform sampler2D u_texture;
    
   
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform float u_energy;     
    uniform float u_danceability;// 0.0 to 1.0
    uniform float u_loudness;   
    uniform float u_pulse;      

   
   
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

   
    float fbm(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 0.0;
        for (int i = 0; i < 3; i++) {
            value += amplitude * snoise(st);
            st *= 2.0;
            amplitude *= 0.5;
        }
        return value;
    }

    void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        float aspect = u_resolution.x / u_resolution.y;
        st.x *= aspect;

       
       
        float slowTime = u_time * (0.1 + u_energy * 0.2);
        
        vec2 q = vec2(0.0);
        q.x = fbm(st + 0.1 * slowTime);
        q.y = fbm(st + vec2(1.0));

        vec2 r = vec2(0.0);
        r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * slowTime);
        r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * slowTime);

        float f = fbm(st + r);

       
       
       
        vec3 colorShadow = u_color1 * 0.4; 
        
        vec3 color = mix(u_color1, u_color2, clamp(f * f * 4.0, 0.0, 1.0));
        color = mix(color, colorShadow, clamp(length(q), 0.0, 1.0));
        
       
       
        vec2 texUV = v_uv + r * 0.1; 
        vec4 texColor = texture2D(u_texture, texUV);
        
       
        color = mix(color, color * texColor.rgb * 1.5, 0.2 + u_loudness * 0.1);

       
       
        color += vec3(0.05) * u_pulse * u_danceability;

       
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        uv *=  1.0 - uv.yx; 
        float vig = uv.x * uv.y * 15.0; 
        vig = pow(vig, 0.25);
        color *= vig;

       
       
        float noise = fract(sin(dot(v_uv * u_time, vec2(12.9898, 78.233))) * 43758.5453);
        color += (noise - 0.5) * 0.03;

        gl_FragColor = vec4(color, 1.0);
    }
`;

export const DynamicBackground = memo((props: DynamicBackgroundProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const textureRef = useRef<WebGLTexture | null>(null);
    const frameRef = useRef<number>(0);
    const startTimeRef = useRef<number>(performance.now());


    const currentValues = useRef({
        c1: [0.1, 0.1, 0.2],
        c2: [0.2, 0.1, 0.3],
        energy: 0.5,
        dance: 0.5,
        loud: 0.5
    });


    const propsRef = useRef(props);
    useEffect(() => { propsRef.current = props; }, [props]);


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
        if (!gl) return;
        glRef.current = gl;


        const createShader = (type: number, source: string) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error("Shader Error:", gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertexShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
        const fragmentShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
        programRef.current = program;


        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
        ]), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);


        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
        textureRef.current = texture;


        return () => {
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteBuffer(buffer);
            gl.deleteTexture(texture);
            cancelAnimationFrame(frameRef.current);
        };
    }, []);


    useEffect(() => {
        const gl = glRef.current;
        const texture = textureRef.current;
        if (!gl || !texture || !props.albumArt) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = props.albumArt;
        img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        };
    }, [props.albumArt]);


    useEffect(() => {
        const gl = glRef.current;
        const program = programRef.current;
        if (!gl || !program) return;

        const uLocations = {
            res: gl.getUniformLocation(program, "u_resolution"),
            time: gl.getUniformLocation(program, "u_time"),
            c1: gl.getUniformLocation(program, "u_color1"),
            c2: gl.getUniformLocation(program, "u_color2"),
            energy: gl.getUniformLocation(program, "u_energy"),
            dance: gl.getUniformLocation(program, "u_danceability"),
            loud: gl.getUniformLocation(program, "u_loudness"),
            pulse: gl.getUniformLocation(program, "u_pulse"),
        };

        const render = (now: number) => {
            const p = propsRef.current;
            const elapsed = (now - startTimeRef.current) * 0.001;


            if (canvasRef.current) {
                const displayWidth = canvasRef.current.clientWidth;
                const displayHeight = canvasRef.current.clientHeight;
                if (canvasRef.current.width !== displayWidth || canvasRef.current.height !== displayHeight) {
                    canvasRef.current.width = displayWidth;
                    canvasRef.current.height = displayHeight;
                    gl.viewport(0, 0, displayWidth, displayHeight);
                }
            }


            const colors = p.colors;
            let targetC1 = colors[0]?.rgb || [0.1, 0.1, 0.2];
            let targetC2 = colors[1]?.rgb || [0.2, 0.1, 0.3];


            if (targetC1.some(c => c > 1)) targetC1 = targetC1.map(c => c / 255);
            if (targetC2.some(c => c > 1)) targetC2 = targetC2.map(c => c / 255);

            const features = p.songData?.audio_features;
            const targetEnergy = features?.energy || 0.5;
            const targetDance = features?.danceability || 0.5;
            const rawLoud = features ? (features.loudness + 60) / 60 : 0.5;
            const targetLoud = Math.max(0, Math.min(1, rawLoud));


            const curr = currentValues.current;
            const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
            const lerpFactor = 0.02;

            curr.c1[0] = lerp(curr.c1[0], targetC1[0], lerpFactor);
            curr.c1[1] = lerp(curr.c1[1], targetC1[1], lerpFactor);
            curr.c1[2] = lerp(curr.c1[2], targetC1[2], lerpFactor);

            curr.c2[0] = lerp(curr.c2[0], targetC2[0], lerpFactor);
            curr.c2[1] = lerp(curr.c2[1], targetC2[1], lerpFactor);
            curr.c2[2] = lerp(curr.c2[2], targetC2[2], lerpFactor);

            curr.energy = lerp(curr.energy, targetEnergy, lerpFactor);
            curr.dance = lerp(curr.dance, targetDance, lerpFactor);
            curr.loud = lerp(curr.loud, targetLoud, lerpFactor);


            const tempo = features?.tempo || 120;
            const beatDuration = 60 / tempo;

            const pulse = Math.pow(Math.sin(p.currentTimeRef.current * Math.PI / beatDuration), 4.0);


            gl.uniform2f(uLocations.res, gl.canvas.width, gl.canvas.height);
            gl.uniform1f(uLocations.time, elapsed);
            gl.uniform3f(uLocations.c1, curr.c1[0], curr.c1[1], curr.c1[2]);
            gl.uniform3f(uLocations.c2, curr.c2[0], curr.c2[1], curr.c2[2]);
            gl.uniform1f(uLocations.energy, curr.energy);
            gl.uniform1f(uLocations.dance, curr.dance);
            gl.uniform1f(uLocations.loud, curr.loud);
            gl.uniform1f(uLocations.pulse, pulse);

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            if (p.isPlaying) {
                frameRef.current = requestAnimationFrame(render);
            }
        };

        if (props.isPlaying) {
            frameRef.current = requestAnimationFrame(render);
        }

        return () => cancelAnimationFrame(frameRef.current);
    }, [props.isPlaying]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: -1,
            }}
        />
    );
});