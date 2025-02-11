// Initialisation de la scène
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const lenght = 500;

// Générer des lumières aléatoires au-dessus du plan
const numLights = 10; // Nombre de lumières
const minHeight = 15, maxHeight = 70; // Hauteur aléatoire
const minIntensity = 2, maxIntensity = 15; // Intensité aléatoire
const minRange = 300, maxRange = lenght; // Distance d'effet

for (let i = 0; i < numLights; i++) {
	const color = Math.random() * 0xffffff;
	const posX = (Math.random() - 0.5) * 2 * lenght;
	const posZ = (Math.random() - 0.5) * 2 * lenght;
	const posY = Math.random() * (maxHeight - minHeight) + minHeight;
	const intensity = Math.random() * (maxIntensity - minIntensity) + minIntensity;
	const range = Math.random() * (maxRange - minRange) + minRange;

	const pointLight = new THREE.PointLight(color, intensity, range);
	pointLight.position.set(posX, posY, posZ);
	scene.add(pointLight);
}

// Lumière rouge qui suit le cube
const redLight = new THREE.PointLight(0xb3b3b3, 3, 15);
scene.add(redLight);

// Sol avec plus de lignes pour mieux voir la perspective
const planeGeometry = new THREE.PlaneGeometry(2 * lenght, 2 * lenght, lenght / 10, lenght / 10);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, wireframe: true });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// Cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x5b5b5b });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Position initiale
cube.position.y = 1;
camera.position.set(0, 2.5, 2);
camera.lookAt(cube.position);
let isOnPlatform = false;

// Variables de physique
const speed = 1;
const gravity = 0.02;
const movement = { forward: 0, backward: 0, left: 0, right: 0 };
const velocity = { x: 0, y: 0, z: 0 };
let lastRotation = 0;

const platforms = [];
const varPlatformHeight = 2; // Variation de hauteur des plateformes
const platformSize = 15 + Math.random() * 15; // Taille des plateformes
const numLevels = 5; // Nombre d'étages
const levelSpacing = 10; // Distance moyenne entre chaque étage
const numPlatformsPerLevel = 40; // Nombre de plateformes par étage

for (let level = 1; level < numLevels; level++) {
    const baseHeight = level * levelSpacing; // Hauteur moyenne de l'étage

    for (let i = 0; i < numPlatformsPerLevel; i++) {
        const platformGeometry = new THREE.BoxGeometry(platformSize, 0.1, platformSize);
        const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);

        // Position aléatoire sur l'étage
        const posX = (Math.random() - 0.5) * 2 * lenght * 0.8;
        const posZ = (Math.random() - 0.5) * 2 * lenght * 0.8;
        const posY = baseHeight + (Math.random() * 2 - 1) * varPlatformHeight; // Variation de hauteur de ±2

        platform.position.set(posX, posY, posZ);
        scene.add(platform);
        platforms.push(platform);
    }
}

// Gestion du clavier
document.addEventListener("keydown", (event) => {
	if (event.key === "z") movement.forward = speed;
	if (event.key === "s") movement.backward = speed;
	if (event.key === "q") movement.left = speed;
	if (event.key === "d") movement.right = speed;
	if (event.key === " " && (cube.position.y === 1 || isOnPlatform)) {
		velocity.y = 0.7;
	}
});
document.addEventListener("keyup", (event) => {
	if (event.key === "z") movement.forward = 0;
	if (event.key === "s") movement.backward = 0;
	if (event.key === "q") movement.left = 0;
	if (event.key === "d") movement.right = 0;
});

// Gestion de la souris
let isMouseDown = false;
let rotation = { x: 0, y: 0 , z: 0};
let cameraDistance = 10;
let prevMouseX = 0, prevMouseY = 0;

document.addEventListener("mousedown", () => {
	isMouseDown = true;
});
document.addEventListener("mouseup", () => {
	isMouseDown = false;
});
document.addEventListener("mousemove", (event) => {
	const deltaX = event.clientX - prevMouseX;
	const deltaY = event.clientY - prevMouseY;

	rotation.y -= deltaX * 0.005;
	rotation.x -= deltaY * 0.0025;

	rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.x));
	
	prevMouseX = event.clientX;
	prevMouseY = event.clientY;
});
document.addEventListener("wheel", (event) => {
	cameraDistance += event.deltaY * 0.02;
	cameraDistance = Math.max(1, Math.min(cameraDistance, 100));
});

// Animation
function animate() {
	requestAnimationFrame(animate);

	// Gravité
	velocity.y -= gravity;
	cube.position.y += velocity.y;

	// Vérification des collisions avec le sol ou une plateforme
	isOnPlatform = false;
	
	for (const platform of platforms) {
		const dx = Math.abs(cube.position.x - platform.position.x);
		const dz = Math.abs(cube.position.z - platform.position.z);
		const dy = cube.position.y - platform.position.y;

		if (dx < platformSize / 2 && dz < platformSize / 2) {
			if (dy >= 0 && dy <= 0.6 && velocity.y < 0) { 
				// Collision par le bas
				cube.position.y = platform.position.y + 0.6;
				velocity.y = 0;
				isOnPlatform = true;
				break;
			} else if (dy < 0 && dy >= -1 && velocity.y > 0) { 
				// Collision par le haut
				cube.position.y = platform.position.y - 0.5;
				velocity.y = 0;
				break;
			}
		}

	}
	
	if (!isOnPlatform && cube.position.y < 1 && Math.max(Math.abs(cube.position.x), Math.abs(cube.position.z)) < lenght) {
		cube.position.y = 1;
		velocity.y = 0;
		isOnPlatform = false;
	}

	let moveDirection = new THREE.Vector3(
		Math.sin(rotation.y),
		0,
		Math.cos(rotation.y)
	).normalize();

	let right = new THREE.Vector3().crossVectors(moveDirection, new THREE.Vector3(0, 1, 0)).normalize();
	
	let moveX = (movement.right - movement.left) * speed;
	let moveZ = (movement.forward - movement.backward) * speed;
	
	/* if (isMouseDown) {
		moveX *= -1
		moveZ *= -1
	} */
	
	cube.position.addScaledVector(moveDirection, moveZ);
	cube.position.addScaledVector(right, moveX);

	const cameraOffset = new THREE.Vector3(0, 5, -cameraDistance).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.y);
	camera.position.copy(cube.position).add(cameraOffset);

	camera.rotation.set(rotation.x, rotation.y, 0);
	cube.rotation.y = rotation.y;
	cube.rotation.x = rotation.x * velocity.y * Math.sqrt(moveX ** 2 + moveZ ** 2) / 10;

	camera.position.copy(cube.position).add(cameraOffset);
		camera.lookAt(cube.position);
	
	if (!isMouseDown) {
	}
	else {
		camera.position.copy(cube.position)
	}
	
	redLight.position.copy(cube.position);
	renderer.render(scene, camera);
}

camera.lookAt(cube.position);
animate();
