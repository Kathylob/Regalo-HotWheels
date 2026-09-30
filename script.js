import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ===============================
// 1. ESCENA Y CONFIGURACIÓN BASE
// ===============================

const escena = new THREE.Scene();
escena.background = new THREE.Color(0x0a0a12); // Fondo oscuro elegante

const camara = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);
camara.position.set(0, 450, 650);

const renderizador = new THREE.WebGLRenderer({ antialias: true });
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.getElementById("escena3D").appendChild(renderizador.domElement);

// ===============================
// 2. LUCES (Estilo Hot Wheels)
// ===============================

const luzAmbiente = new THREE.AmbientLight(0xffffff, 1.8);
escena.add(luzAmbiente);

const luzPrincipal = new THREE.DirectionalLight(0xffffff, 2.5);
luzPrincipal.position.set(200, 500, 300);
escena.add(luzPrincipal);

// Luz de acento estilo Hot Wheels
const luzAcento = new THREE.DirectionalLight(0xff5500, 1.2);
luzAcento.position.set(-200, 300, -300);
escena.add(luzAcento);

// ===============================
// 3. PISTA 3D REAL
// ===============================

const cargador = new GLTFLoader();
const objetosPista = [];
const ESCALA_PISTA = 4;

cargador.load(
    "modelos/low_poly_race_track.glb",
    function (glb) {
        const pistaReal = glb.scene;

        pistaReal.traverse((parte) => {
            if (parte.isMesh) {
                // Piezas sueltas y bloques fuera de la pista para ocultar
                const piezasSueltas = [
    "Cube.028",
    "Cube.033",
    "Cube.034"
];
                
                const esPiezaSuelta = piezasSueltas.some((nombre) =>
                    parte.name.includes(nombre)
                );

                if (esPiezaSuelta) {
                    parte.visible = false;
                } else {
                    objetosPista.push(parte);

                    // Embellecer materiales de la pista
                    if (parte.material) {
                        const materiales = Array.isArray(parte.material)
                            ? parte.material
                            : [parte.material];

                        materiales.forEach((material) => {
                            if (!material) return;

                            // Detalles rojos / color principal
                            if (parte.name.toLowerCase().includes("red") || parte.name.toLowerCase().includes("borde")) {
                                material.color.set(0xff1100); // Rojo encendido
                            } else {
                                material.color.set(0x222228); // Pista gris oscuro asfalto
                            }

                            if ("roughness" in material) material.roughness = 0.45;
                            if ("metalness" in material) material.metalness = 0.25;
                        });
                    }
                }
            }
        });

        pistaReal.scale.set(ESCALA_PISTA, ESCALA_PISTA, ESCALA_PISTA);
        pistaReal.position.set(0, 0, 0);
        escena.add(pistaReal);

        console.log("🏎️ ¡Pista 3D cargada y ajustada correctamente!");
    },
    (progreso) => {
        if (progreso.total > 0) {
            console.log("Cargando pista:", ((progreso.loaded / progreso.total) * 100).toFixed(0) + "%");
        }
    },
    (error) => console.error("❌ No se pudo cargar la pista 3D:", error)
);

// ===============================
// 4. TRAYECTORIA DE LA PISTA
// ===============================

const puntosOriginales = [
    [-26.35, -91.17],
    [-47.56, -91.17],
    [-71.84, -86.98],
    [-77.09, -63.58],
    [-82.33, -40.22],
    [-106.58, -36.04],
    [-130.85, -31.85],
    [-131.91, -5.63],
    [-96.30, 0.01],
    [-74.87, 0.01],
    [-45, 0.01],
    [0, 0.01],
    [45, 0.01],
    [74.78, 0.01],
    [99.47, 4.87],
    [103.66, 29.11],
    [103.66, 59.18],
    [98.41, 82.50],
    [80.53, 86.69],
    [65.63, 86.69],
    [44.33, 86.69],
    [-6.95, 86.90],
    [-28.29, 86.90],
    [-51.73, 81.64],
    [-55.92, 57.37],
    [-50.67, 33.99],
    [-28.29, 29.79],
    [-4.01, 25.60],
    [1.24, 2.19],
    [1.24, -18.99],
    [1.24, -40.31],
    [1.24, -61.64],
    [-2.96, -85.91]
];

const puntos = puntosOriginales.map(
    ([x, z]) => new THREE.Vector3(x * ESCALA_PISTA, 0, z * ESCALA_PISTA)
);

const trayectoria = new THREE.CatmullRomCurve3(
    puntos,
    true,
    "centripetal",
    0.15
);

// ===============================
// 5. VEHÍCULO SYNKRO
// ===============================

const coche = new THREE.Group();
const cocheModelo = new THREE.Group();
coche.add(cocheModelo);
escena.add(coche); // Agregamos el coche a la escena global

const cargadorCoche = new GLTFLoader();

cargadorCoche.load(
    "modelos/hot_wheels_-_unleashed_synkro.glb",
    function (glb) {
        const synkro = glb.scene;

        synkro.updateMatrixWorld(true);
        const caja = new THREE.Box3().setFromObject(synkro);
        const tamaño = caja.getSize(new THREE.Vector3());

        const longitudDeseada = 35;
        const longitudActual = Math.max(tamaño.x, tamaño.z);
        const escala = longitudActual > 0 ? longitudDeseada / longitudActual : 1;

        synkro.scale.setScalar(escala);
        synkro.position.set(0, 0, 0);

        // Si el auto avanza de lado, ajusta aquí: Math.PI / 2, Math.PI, etc.
        synkro.rotation.y = 0; 

        cocheModelo.add(synkro);

        // Posición inicial sobre la pista
        const puntoInicio = trayectoria.getPointAt(0);
        coche.position.set(puntoInicio.x, 10, puntoInicio.z);

        console.log("🔥 ¡Synkro cargado correctamente!");
    },
    (progreso) => {
        if (progreso.total > 0) {
            console.log("Cargando Synkro:", ((progreso.loaded / progreso.total) * 100).toFixed(0) + "%");
        }
    },
    (error) => console.error("❌ No se pudo cargar el Synkro:", error)
);

// ===============================
// 6. MOVIMIENTO Y RAYCASTING
// ===============================

let progreso = 0;
let enMovimiento = false;
const raycaster = new THREE.Raycaster();

function moverCoche() {
    if (!enMovimiento) return;

    progreso += 0.0008;
    if (progreso >= 1) progreso = 0;

    const posicion = trayectoria.getPointAt(progreso);
    const siguiente = trayectoria.getPointAt((progreso + 0.005) % 1);

    coche.position.x = posicion.x;
    coche.position.z = posicion.z;

    // Raycast para ajustar suavemente la altura sobre el suelo de la pista
    const origenRayo = new THREE.Vector3(coche.position.x, coche.position.y + 200, coche.position.z);
    raycaster.set(origenRayo, new THREE.Vector3(0, -1, 0));

    const impactos = raycaster.intersectObjects(objetosPista, true);

    if (impactos.length > 0) {
        const alturaObjetivo = impactos[0].point.y + 3.5;
        // Transición de altura suave para evitar saltos bruscos
        coche.position.y += (alturaObjetivo - coche.position.y) * 0.2; 
    }

    coche.lookAt(siguiente.x, coche.position.y, siguiente.z);
}

// ===============================
// 7. CÁMARA E INTERACCIÓN
// ===============================

let anguloObjetivo = 0;
let anguloVerticalObjetivo = 0.6;

// ===============================
// 8. BUCLE DE ANIMACIÓN
// ===============================

function animar() {

    requestAnimationFrame(animar);

    camara.lookAt(0, 0, 0);

    moverCoche();

    renderizador.render(
        escena,
        camara
    );
}

animar();

// ===============================
// 9. EVENTOS UI (MENSAJE INICIAL)
// ===============================

const mensajeBtn = document.getElementById("mensaje");

if (mensajeBtn) {
    mensajeBtn.addEventListener("click", () => {
        enMovimiento = true;

        // Ocultar botón de inicio
        mensajeBtn.style.opacity = "0";
        setTimeout(() => {
            mensajeBtn.style.display = "none";
            mostrarTarjetaRomantica();
        }, 400);
    });
}

function mostrarTarjetaRomantica() {
    const card = document.createElement("div");
    card.className = "tarjeta-mensaje";
    card.innerHTML = `
        <h2 style="color: #ff8c00; margin-bottom: 8px;">¡Eres mi coleccionable favorito! 🔥</h2>
        <p style="font-size: 0.95rem; line-height: 1.4;">Gracias por recorrer cada curva a mi lado. Te amo ♡</p>
    `;
    document.body.appendChild(card);

    setTimeout(() => card.classList.add("activa"), 100);
}

// Redimensionar pantalla
window.addEventListener("resize", () => {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
});