class Cursor3D {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10000;
        `;
        document.body.appendChild(this.container);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = 15;
        this.butterflies = [];
        this.butterflyColors = [
            { color1: 0xffd1dc, color2: 0xffe4e1 }, // Light pink to Misty rose
            { color1: 0xe0ffe0, color2: 0xf0fff0 }, // Very pale green
            { color1: 0xffc0cb, color2: 0xffe4e1 }, // Pink to Misty rose
            { color1: 0xebffeb, color2: 0xf5fff5 }, // Another pale green
            { color1: 0xfae1dd, color2: 0xffeef2 }  // Very soft pink
        ];
        
        this.createMultipleButterflies();
        this.addLights();
        this.animate();
        this.addEventListeners();
    }

    createMultipleButterflies() {
        // Create butterflies with different starting positions and scroll triggers
        const butterflyConfigs = [
            { 
                position: { x: -10, y: 5, z: 0 },
                scrollTrigger: 0,  // Appears immediately
                scale: 0.6
            },
            { 
                position: { x: 10, y: -3, z: -2 },
                scrollTrigger: 0.2,  // Appears after 20% scroll
                scale: 0.5
            },
            { 
                position: { x: -5, y: 8, z: -1 },
                scrollTrigger: 0.4,  // Appears after 40% scroll
                scale: 0.7
            },
            { 
                position: { x: 8, y: -5, z: 1 },
                scrollTrigger: 0.6,  // Appears after 60% scroll
                scale: 0.55
            },
            { 
                position: { x: -12, y: 3, z: -1 },
                scrollTrigger: 0.3,  // Appears after 30% scroll
                scale: 0.65
            }
        ];

        butterflyConfigs.forEach((config, index) => {
            const butterfly = this.createFantasyButterfly(
                this.butterflyColors[index % this.butterflyColors.length],
                config.position,
                config.scale
            );
            butterfly.visible = config.scrollTrigger === 0; // Only show initial butterflies
            butterfly.userData = {
                ...butterfly.userData,
                scrollTrigger: config.scrollTrigger,
                initialPosition: { ...config.position }
            };
            this.butterflies.push(butterfly);
        });
    }

    createFantasyButterfly(colors, position, scale) {
        // Create realistic wing shape
        const wingShape = new THREE.Shape();
        
        // Main wing outline
        wingShape.moveTo(0, 0);
        wingShape.bezierCurveTo(1, 1, 2, 2, 3, 1);    // Upper curve
        wingShape.bezierCurveTo(4, 0, 3.5, -1, 3, -2); // Outer curve
        wingShape.bezierCurveTo(2, -3, 1, -2, 0, -1);  // Lower curve
        wingShape.bezierCurveTo(0.5, -0.5, 0.5, -0.5, 0, 0); // Inner curve

        // Add wing details
        const holeShape1 = new THREE.Path();
        holeShape1.absellipse(1.5, 0, 0.3, 0.5, 0, Math.PI * 2);
        wingShape.holes.push(holeShape1);

        const holeShape2 = new THREE.Path();
        holeShape2.absellipse(2.2, -0.5, 0.2, 0.3, 0, Math.PI * 2);
        wingShape.holes.push(holeShape2);

        const wingGeometry = new THREE.ShapeGeometry(wingShape, 32);
        
        // Enhanced wing material with more realistic shading
        const wingMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(colors.color1) },
                color2: { value: new THREE.Color(colors.color2) },
                pattern: { value: new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABISURBVBiVY2QgA/z///8/IyMjA8P///9xKmZiYGBgYGVlZcCnQEBAgAGbHYyMjP/xKYCpZ2RkZGD8//8/AyMjI1YFyOphigE8qBsbjHQwxQAAAABJRU5ErkJggg==') }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;

                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color1;
                uniform vec3 color2;
                uniform sampler2D pattern;
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    // Base color gradient
                    float shimmer = sin(vUv.x * 10.0 + time * 2.0) * 0.5 + 0.5;
                    vec3 baseColor = mix(color1, color2, shimmer);
                    
                    // Pattern overlay
                    vec4 patternColor = texture2D(pattern, vUv * 5.0);
                    
                    // Iridescence effect
                    float iridescence = sin(vPosition.x * 5.0 + time) * 0.5 + 0.5;
                    vec3 iridColor = mix(color1, color2, iridescence);
                    
                    // Combine effects
                    vec3 finalColor = mix(baseColor, iridColor, patternColor.r * 0.5);
                    
                    // Edge highlighting
                    float fresnel = pow(1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
                    finalColor += vec3(1.0) * fresnel * 0.5;
                    
                    float opacity = 0.95 * (sin(vUv.y * 3.14159) * 0.1 + 0.9);
                    gl_FragColor = vec4(finalColor, opacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        const butterfly = new THREE.Group();
        
        // Create wings with more depth
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        
        leftWing.position.set(-0.1, 0, 0);
        rightWing.position.set(0.1, 0, 0);
        rightWing.scale.x = -1;
        
        // Add slight bend to wings for more realism
        leftWing.rotation.z = 0.1;
        rightWing.rotation.z = -0.1;
        
        butterfly.add(leftWing);
        butterfly.add(rightWing);

        // Create detailed body
        const bodyGroup = new THREE.Group();
        
        // Thorax (main body)
        const thoraxGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.8, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: colors.color1,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        const thorax = new THREE.Mesh(thoraxGeometry, bodyMaterial);
        
        // Abdomen (tail)
        const abdomenGeometry = new THREE.CylinderGeometry(0.06, 0.02, 0.6, 8);
        const abdomen = new THREE.Mesh(abdomenGeometry, bodyMaterial);
        abdomen.position.y = -0.6;
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 0.4;
        
        // Antennae
        const antennaGeometry = new THREE.CylinderGeometry(0.01, 0.005, 0.3, 4);
        const leftAntenna = new THREE.Mesh(antennaGeometry, bodyMaterial);
        const rightAntenna = new THREE.Mesh(antennaGeometry, bodyMaterial);
        
        leftAntenna.position.set(-0.05, 0.5, 0);
        rightAntenna.position.set(0.05, 0.5, 0);
        leftAntenna.rotation.z = -0.3;
        rightAntenna.rotation.z = 0.3;
        
        bodyGroup.add(thorax);
        bodyGroup.add(abdomen);
        bodyGroup.add(head);
        bodyGroup.add(leftAntenna);
        bodyGroup.add(rightAntenna);
        
        bodyGroup.rotation.x = Math.PI / 2;
        butterfly.add(bodyGroup);

        butterfly.scale.set(scale, scale, scale);
        butterfly.position.copy(position);
        butterfly.userData = {
            initialPosition: { ...position },
            speed: 0.5 + Math.random() * 0.5,
            phase: Math.random() * Math.PI * 2,
            wingFlapSpeed: 12 + Math.random() * 4,
            flapAmplitude: 0.7 + Math.random() * 0.2
        };

        // Add particle system
        const particles = this.createParticleSystem(butterfly);
        butterfly.userData.particles = particles;

        this.scene.add(butterfly);
        return butterfly;
    }

    createParticleSystem(butterfly) {
        const particleCount = 25;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        // Create simple point material instead of shader material
        const particleMaterial = new THREE.PointsMaterial({
            color: butterfly.userData.color1,
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        // Create particles in a smaller radius around the butterfly
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 0.8;     // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.8; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.8; // z
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particles = new THREE.Points(geometry, particleMaterial);
        particles.userData = { 
            initialPositions: positions.slice(),
            speed: Math.random() * 0.5 + 0.5
        };

        // Add a second layer of particles for more visibility
        const particles2 = new THREE.Points(geometry.clone(), particleMaterial.clone());
        particles2.material.size = 0.15;
        particles2.material.opacity = 0.6;
        particles.add(particles2);

        butterfly.add(particles);
        return particles;
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 1);
        this.scene.add(directionalLight);
    }

    addEventListeners() {
        let lastScrollTime = Date.now();
        let isMoving = false;

        window.addEventListener('scroll', () => {
            lastScrollTime = Date.now();
            isMoving = true;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const scrollProgress = window.scrollY / maxScroll;

            this.butterflies.forEach((butterfly, index) => {
                if (scrollProgress >= butterfly.userData.scrollTrigger) {
                    if (!butterfly.visible) {
                        butterfly.visible = true;
                        // Entrance animation
                        gsap.from(butterfly.position, {
                            x: butterfly.userData.initialPosition.x - 20,
                            y: butterfly.userData.initialPosition.y - 10,
                            duration: 2,
                            ease: "power2.out"
                        });
                    }

                    // Gentle floating motion instead of rotation
                    const pathX = butterfly.userData.initialPosition.x + Math.sin(scrollProgress * Math.PI + index) * 5;
                    const pathY = butterfly.userData.initialPosition.y + Math.cos(scrollProgress * Math.PI + index) * 3;

                    gsap.to(butterfly.position, {
                        x: pathX,
                        y: pathY,
                        duration: 2,
                        ease: "power1.inOut"
                    });
                }
            });
        });

        // Add continuous movement update
        const updateMovement = () => {
            const currentTime = Date.now();
            if (currentTime - lastScrollTime > 1000) { // After 1 second of no scrolling
                isMoving = false;
                this.butterflies.forEach((butterfly, index) => {
                    if (butterfly.visible) {
                        const time = currentTime * 0.001;
                        const radius = 3 + index * 0.5;
                        const speed = 0.5 + index * 0.1;
                        
                        // Circular/figure-eight movement
                        const newX = butterfly.userData.initialPosition.x + Math.sin(time * speed) * radius;
                        const newY = butterfly.userData.initialPosition.y + Math.sin(time * speed * 2) * radius * 0.5;

                        gsap.to(butterfly.position, {
                            x: newX,
                            y: newY,
                            duration: 2,
                            ease: "power1.inOut"
                        });
                    }
                });
            }
            requestAnimationFrame(updateMovement);
        };
        updateMovement();

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        this.butterflies.forEach((butterfly) => {
            if (butterfly.visible) {
                // Enhanced wing flapping animation
                const wingFlap = Math.sin(time * butterfly.userData.wingFlapSpeed) * butterfly.userData.flapAmplitude;
                butterfly.children[0].rotation.y = wingFlap; // Left wing
                butterfly.children[1].rotation.y = -wingFlap; // Right wing

                // Update shader time uniform for shimmer effect
                butterfly.children[0].material.uniforms.time.value = time;
                butterfly.children[1].material.uniforms.time.value = time;

                // Natural floating motion
                const floatY = Math.sin(time + butterfly.userData.phase) * 0.005 * butterfly.userData.speed;
                const floatX = Math.cos(time * 0.5 + butterfly.userData.phase) * 0.003 * butterfly.userData.speed;
                
                butterfly.position.y += floatY;
                butterfly.position.x += floatX;

                // Slight body tilt based on movement
                butterfly.rotation.z = floatX * 2;
                butterfly.rotation.x = floatY * 2;

                // Update particles
                if (butterfly.userData.particles) {
                    const particles = butterfly.userData.particles;
                    const positions = particles.geometry.attributes.position.array;
                    const initialPositions = particles.userData.initialPositions;

                    for (let i = 0; i < positions.length; i += 3) {
                        const phase = time + i;
                        // Simple circular motion
                        positions[i] = initialPositions[i] + Math.sin(phase) * 0.2;
                        positions[i + 1] = initialPositions[i + 1] + Math.cos(phase) * 0.2;
                        positions[i + 2] = initialPositions[i + 2] + Math.sin(phase * 0.5) * 0.1;
                    }
                    particles.geometry.attributes.position.needsUpdate = true;

                    // Make particles follow butterfly with slight delay
                    particles.position.x = Math.sin(time * 0.5) * 0.1;
                    particles.position.y = Math.cos(time * 0.5) * 0.1;
                }
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the 3D cursor
const cursor3D = new Cursor3D();