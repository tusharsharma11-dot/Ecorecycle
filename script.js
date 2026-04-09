// ==========================================
// 1. THREE.JS PERFORMANCE OPTIMIZED
// ==========================================
let scene, camera, renderer, earth, clouds, stars;
let targetEarthPositionX = 0; 
let targetCameraZ = 16;     
let isDashboard = false;    
let targetEarthRotationY = null;
let targetEarthRotationX = 0;

function init3DBackground() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 16;
    
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); 
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.1));
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5); 
    sunLight.position.set(5, 3, 5); 
    scene.add(sunLight);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'Anonymous'; 

    earth = new THREE.Mesh(
        new THREE.SphereGeometry(6, 64, 64),
        new THREE.MeshPhongMaterial({
            map: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'),
            bumpMap: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png'),
            bumpScale: 0.15,
            specularMap: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-water.png'),
            specular: new THREE.Color('grey'),
            shininess: 5
        })
    );
    scene.add(earth);

    clouds = new THREE.Mesh(
        new THREE.SphereGeometry(6.1, 64, 64),
        new THREE.MeshPhongMaterial({
            map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'),
            transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
        })
    );
    earth.add(clouds);

    const starsGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(1500 * 3);
    for(let i = 0; i < 1500 * 3; i++) posArray[i] = (Math.random() - 0.5) * 100;
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ size: 0.05, color: 0xffffff, transparent: true, opacity: 0.8 }));
    scene.add(stars);

    animate();
    window.addEventListener('resize', onWindowResize, false);
}

function animate() {
    requestAnimationFrame(animate);
    if (!isDashboard) {
        earth.rotation.y += 0.001; clouds.rotation.y += 0.0013; 
        earth.rotation.x += (0 - earth.rotation.x) * 0.05; clouds.rotation.x += (0 - clouds.rotation.x) * 0.05;
    } else {
        if (targetEarthRotationY !== null && Math.abs(targetEarthRotationY - earth.rotation.y) > 0.01) {
            earth.rotation.y += (targetEarthRotationY - earth.rotation.y) * 0.05;
            clouds.rotation.y += (targetEarthRotationY - clouds.rotation.y) * 0.05;
        } else {
            earth.rotation.y += 0.0003; clouds.rotation.y += 0.0004; targetEarthRotationY = earth.rotation.y; 
        }
        earth.rotation.x += (targetEarthRotationX - earth.rotation.x) * 0.05;
        clouds.rotation.x += (targetEarthRotationX - clouds.rotation.x) * 0.05;
    }
    stars.rotation.y -= 0.0002; 
    earth.position.x += (targetEarthPositionX - earth.position.x) * 0.03;
    camera.position.z += (targetCameraZ - camera.position.z) * 0.05;
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.onload = init3DBackground;

// ==========================================
// 2. SUPABASE CONFIG & DYNAMIC UI LOGIC
// ==========================================

const supabaseUrl = 'https://uxpogfhgghbpmmckftnr.supabase.co';
const supabaseKey = 'sb_publishable_EQ7L61-t6a0pSikqZWFjkg_Oh7MEUsM'; 
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const pages = {
    landing: document.getElementById('landing-page'), login: document.getElementById('login-container'),
    giver: document.getElementById('giver-page'), collector: document.getElementById('collector-page'),
    quote: document.getElementById('earth-quote'), dashboardNav: document.getElementById('dashboard-navbar')
};

let currentAuthMode = 'login'; 

function toggleAuthMode() {
    currentAuthMode = currentAuthMode === 'login' ? 'signup' : 'login';
    
    document.getElementById('auth-title').innerText = currentAuthMode === 'login' ? 'Login' : 'Create Account';
    document.getElementById('auth-main-btn').innerText = currentAuthMode === 'login' ? 'LOGIN' : 'SIGN UP';
    document.getElementById('auth-toggle-link').innerText = currentAuthMode === 'login' ? "Sign up here" : "Login here";
    
    if(currentAuthMode === 'signup') {
        document.getElementById('auth-main-btn').style.background = 'linear-gradient(to right, #4ade80, #059669)';
    } else {
        document.getElementById('auth-main-btn').style.background = 'linear-gradient(to right, #56CCF2, #d43f8d)';
    }
}

function showLoginScreen(mode = 'login') {
    if (mode !== currentAuthMode) toggleAuthMode(); 

    pages.landing.classList.add('hide');
    isDashboard = false; earth.position.x = 0; targetEarthPositionX = 0; targetCameraZ = 16; 
    setTimeout(() => { pages.quote.classList.add('show'); }, 300);
    setTimeout(() => {
        if(window.innerWidth > 768) { targetEarthPositionX = -4.5; pages.quote.classList.add('move-left'); } 
        else { camera.position.y = -4; }
        pages.login.classList.add('show');
    }, 2000); 
}

function cancelLogin() {
    pages.login.classList.remove('show'); pages.quote.classList.remove('show', 'move-left');
    targetEarthPositionX = 0; if(window.innerWidth <= 768) camera.position.y = 0;
    pages.landing.scrollTop = 0; 
    setTimeout(() => pages.landing.classList.remove('hide'), 1000);
}

// 🚀 FIXED: Bulletproof submitAuth with proper try/catch and Enter key prevention
async function submitAuth(event) {
    if (event) event.preventDefault(); // Prevents the "Enter Key" from reloading the page!

    try {
        const emailInput = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        if (!emailInput || !password || !role) {
            return showToast("Please fill in Email, Password, and select a Role.");
        }

        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
        if (!gmailRegex.test(emailInput)) {
            return showToast("Please enter a valid @gmail.com address.");
        }

        showToast("Processing... Please wait.");

        if (currentAuthMode === 'signup') {
            const defaultName = emailInput.split('@')[0];

            const { data, error } = await supabaseClient.auth.signUp({
                email: emailInput, 
                password: password,
                options: { data: { role: role, display_name: defaultName } } 
            });

            if (error) return showToast("Sign Up Error: " + error.message);
            
            // Check if email confirmation is turned on in Supabase
            if (data.session === null) {
                return showToast("Please check your email to verify your account, or disable Confirm Email in Supabase settings.");
            }
            
            showToast("Account created successfully!");
            
        } else if (currentAuthMode === 'login') {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: emailInput, 
                password: password
            });

            if (error) return showToast("Login Error: " + error.message); 
            
            const savedRole = data.user?.user_metadata?.role;
            if (savedRole && savedRole !== role) {
                await supabaseClient.auth.signOut(); 
                const properRoleName = savedRole === 'giver' ? 'Resident' : 'Recycler';
                return showToast(`Error: This email belongs to a ${properRoleName}.`);
            }
            showToast("Login successful!");
        }
    } catch (err) {
        console.error(err);
        showToast("An unexpected error occurred: " + err.message);
    }
}

async function loginWithGoogle() {
    const role = document.getElementById('role').value;
    if (currentAuthMode === 'signup' && !role) {
        return showToast("Please select your role from the dropdown first to create an account!");
    }
    if (role) localStorage.setItem('pendingGoogleRole', role);

    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin } 
    });
    if (error) showToast("Google Login Error: " + error.message);
}

supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        const user = session.user;
        let role = user.user_metadata?.role;
        let displayName = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email.split('@')[0];
        let city = user.user_metadata?.city || '';

        const pendingRole = localStorage.getItem('pendingGoogleRole');

        if (!role && pendingRole) {
            role = pendingRole;
            await supabaseClient.auth.updateUser({ data: { role: role, display_name: displayName } });
            localStorage.removeItem('pendingGoogleRole');
            showToast("Account successfully linked!");
        } else if (pendingRole && pendingRole !== role) {
            const properRoleName = role === 'giver' ? 'Resident' : 'Recycler';
            showToast(`Notice: You are registered as a ${properRoleName}. Loading dashboard...`);
            localStorage.removeItem('pendingGoogleRole');
        }

        if (role) {
            await supabaseClient.from('profiles').upsert([
                { id: user.id, display_name: displayName, role: role, city: city }
            ]);
        }

        if (!isDashboard) {
            loadDashboard(user, role || 'giver', displayName);
        }
    }
});

function loadDashboard(user, role, displayNameOverride) {
    isDashboard = true; 
    
    pages.landing.classList.add('hide');
    pages.login.classList.remove('show'); pages.quote.classList.remove('show');
    targetEarthPositionX = 0; if(window.innerWidth <= 768) camera.position.y = 0;
    targetCameraZ = 9.5; 
    
    let currentModY = earth.rotation.y % (Math.PI * 2);
    let diff = -1.0 - currentModY;
    while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
    targetEarthRotationY = earth.rotation.y + diff; targetEarthRotationX = 0.3; 

    setTimeout(async () => {
        pages.dashboardNav.classList.remove('hidden');
        
        const displayName = displayNameOverride || (user.user_metadata && user.user_metadata.display_name) || "EcoUser";
        const city = (user.user_metadata && user.user_metadata.city) || "";
        
        document.getElementById('nav-username-display').innerHTML = `<i class="fa-solid fa-circle-user"></i> ${displayName}`;
        document.getElementById('profile-name').value = displayName;
        document.getElementById('profile-city').value = city;
        document.getElementById('profile-role').innerText = role === 'giver' ? 'Resident (Giver)' : 'Recycler (Collector)';

        const { data, error } = await supabaseClient.from('waste_requests').select('*');
        if (!error && data) wasteRequests = data;

        if (role === 'giver') {
            pages.giver.classList.remove('hidden');
            renderGiverRequests(displayName);
            updateNearbyRecyclers(city);
        } else {
            pages.collector.classList.remove('hidden');
            renderCollectorPickups();
            setTimeout(initMap, 100); 
        }
    }, 1500); 
}

async function logout() {
    showToast("Logging out...");
    await supabaseClient.auth.signOut(); 
    
    pages.giver.classList.add('hidden'); 
    pages.collector.classList.add('hidden'); 
    pages.dashboardNav.classList.add('hidden');
    
    document.getElementById('login-form').reset();
    isDashboard = false; targetCameraZ = 16; targetEarthPositionX = 0; targetEarthRotationY = null; targetEarthRotationX = 0;
    pages.landing.scrollTop = 0; 
    
    setTimeout(() => {
        pages.landing.classList.remove('hide');
    }, 300);
    
    setTimeout(() => {
        showToast("Logged out successfully.");
    }, 500);
}

// ==========================================
// 3. PROFILE, SIDEBAR & MODAL LOGIC
// ==========================================

function openProfileModal() { document.getElementById('profile-modal').classList.remove('hidden'); }
function closeProfileModal() { document.getElementById('profile-modal').classList.add('hidden'); }

function openRequestModal(id) {
    const req = wasteRequests.find(r => r.id === id);
    if(!req) return;

    document.getElementById('modal-req-img').src = req.image_data;
    document.getElementById('modal-req-title').innerText = `${req.type} (${req.weight} kg)`;
    document.getElementById('modal-req-price').innerText = `Expected/Paid: ₹${req.rate}`;
    document.getElementById('modal-req-address').innerText = `${req.address}, ${req.city || ''} ${req.pincode ? '- '+req.pincode : ''}`;
    document.getElementById('modal-req-user').innerText = `Posted by: ${req.user_name}`;
    document.getElementById('modal-req-coords').innerText = req.coords || 'No coordinates provided';

    document.getElementById('request-modal').classList.remove('hidden');
}

function closeRequestModal() {
    document.getElementById('request-modal').classList.add('hidden');
}

async function saveProfile() {
    const newName = document.getElementById('profile-name').value.trim();
    const newCity = document.getElementById('profile-city').value.trim();
    if (!newName) return showToast("Name cannot be empty.");

    showToast("Saving profile details...");
    
    const { error } = await supabaseClient.auth.updateUser({
        data: { display_name: newName, city: newCity }
    });

    if (error) return showToast("Error saving profile: " + error.message);

    document.getElementById('nav-username-display').innerHTML = `<i class="fa-solid fa-circle-user"></i> ${newName}`;
    
    const userSession = await supabaseClient.auth.getSession();
    if(userSession.data.session) {
        const user = userSession.data.session.user;
        const role = user.user_metadata.role;
        await supabaseClient.from('profiles').upsert({
            id: user.id,
            display_name: newName,
            city: newCity,
            role: role
        });
    }

    if (!pages.giver.classList.contains('hidden')) {
        updateNearbyRecyclers(newCity);
    }

    showToast("Profile updated successfully!");
    closeProfileModal();
}

async function updateNearbyRecyclers(city) {
    const cityDisplay = document.getElementById('nearby-city-display');
    const countDisplay = document.getElementById('nearby-count');
    const listDisplay = document.getElementById('nearby-recyclers-list');
    
    if(!cityDisplay || !countDisplay || !listDisplay) return;

    if (!city || city.trim() === "") {
        cityDisplay.innerHTML = `Showing recyclers in: <a href="#" onclick="openProfileModal()" style="color:#ff6b6b; text-decoration:underline;">Set City in Profile</a>`;
        countDisplay.innerText = "0";
        listDisplay.innerHTML = "<p style='color:#aaa; font-size:0.85rem; text-align:center;'>Update your city to find active recyclers.</p>";
        return;
    }

    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    cityDisplay.innerHTML = `Showing recyclers in: <strong style="color:#fff;">${formattedCity}</strong>`;

    const { data: collectors, error } = await supabaseClient
        .from('profiles') 
        .select('display_name')
        .eq('role', 'collector')
        .ilike('city', city);

    let activeCount = 0;
    let listHTML = "";

    if (!error && collectors && collectors.length > 0) {
        activeCount = collectors.length;
        const listSize = Math.min(activeCount, 4); 
        
        for(let i=0; i<listSize; i++) {
            listHTML += `
                <div class="recycler-mini-item fade-in" style="animation-delay: ${i*0.1}s">
                    <div class="recycler-avatar"><i class="fa-solid fa-truck"></i></div>
                    <div style="flex-grow: 1;">
                        <h4 style="color:#ddd; font-size:0.9rem; margin:0;">${collectors[i].display_name}</h4>
                        <p style="color:#4ade80; font-size:0.75rem; margin:0;"><i class="fa-solid fa-circle" style="font-size:0.5rem; vertical-align:middle;"></i> Ready for pickup</p>
                    </div>
                </div>
            `;
        }
        if(activeCount > listSize) {
            listHTML += `<div style="text-align: center; margin-top: 15px;"><span style="color:#56CCF2; font-size:0.8rem; font-weight: 600; cursor:pointer; background: rgba(86, 204, 242, 0.1); padding: 5px 12px; border-radius: 12px;">+${activeCount - listSize} more in ${formattedCity}</span></div>`;
        }
    } else {
         listHTML = `<p style='color:#aaa; font-size:0.85rem; text-align:center;'>No registered recyclers found in ${formattedCity} yet.</p>`;
    }

    countDisplay.innerText = activeCount;
    listDisplay.innerHTML = listHTML;

    updateAreaImpact(city);
}

function updateAreaImpact(city) {
    const breakdownList = document.getElementById('impact-breakdown-list');
    if (!breakdownList) return;

    const areaWaste = wasteRequests.filter(req => 
        req.city && 
        req.city.toLowerCase() === city.toLowerCase() && 
        req.status === 'Completed'
    );

    if (areaWaste.length === 0) {
        breakdownList.innerHTML = "<p style='color:#aaa; font-size:0.85rem; text-align:center;'>No completed pickups in this area yet.</p>";
        return;
    }

    const totals = {};
    areaWaste.forEach(req => {
        if (!totals[req.type]) totals[req.type] = 0;
        totals[req.type] += parseFloat(req.weight);
    });

    const typeConfig = {
        'Paper': { icon: 'fa-newspaper', color: '#f6e58d' },
        'Plastics': { icon: 'fa-bottle-water', color: '#ffbe76' },
        'E-Waste': { icon: 'fa-plug', color: '#ff7979' },
        'Metals': { icon: 'fa-can-food', color: '#badc58' },
        'Glass': { icon: 'fa-wine-glass', color: '#7ed6df' }
    };

    let html = "";
    for (const [type, weight] of Object.entries(totals)) {
        const config = typeConfig[type] || { icon: 'fa-recycle', color: '#56CCF2' };
        html += `
            <div class="fade-in" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid ${config.icon}" style="color: ${config.color}; width: 20px; text-align: center;"></i>
                    <span style="color: #ddd; font-size: 0.9rem;">${type}</span>
                </div>
                <strong style="color: #fff; font-size: 0.95rem;">${weight.toFixed(1)} kg</strong>
            </div>
        `;
    }
    breakdownList.innerHTML = html;
}

// ==========================================
// 4. APP LOGIC & MAPS 
// ==========================================

let wasteRequests = []; 
let currentImageBase64 = ""; 
let map; let markers = [];

function initMap() {
    if (!map) {
        map = L.map('recycler-map', {scrollWheelZoom: false}).setView([18.5204, 73.8567], 11);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    }
    map.invalidateSize(); 
    updateMapMarkers();
}

function updateMapMarkers() {
    if(!map) return;
    markers.forEach(m => map.removeLayer(m)); markers = [];
    let bounds = [];
    
    const cityFilterInput = document.getElementById('city-filter');
    const cityFilter = cityFilterInput ? cityFilterInput.value.toLowerCase() : "";

    const typeFilterInput = document.getElementById('type-filter');
    const typeFilter = typeFilterInput ? typeFilterInput.value : "";

    let pendingReqs = wasteRequests.filter(req => req.status === 'Pending');
    
    if (cityFilter) {
        pendingReqs = pendingReqs.filter(req => req.city && req.city.toLowerCase().includes(cityFilter));
    }

    if (typeFilter) {
        pendingReqs = pendingReqs.filter(req => req.type === typeFilter);
    }

    pendingReqs.forEach(req => {
        let lat, lon;
        if (req.coords && req.coords.includes(',')) {
            let parts = req.coords.split(',');
            lat = parseFloat(parts[0]); lon = parseFloat(parts[1]);
        } 

        if (lat && lon) {
            let marker = L.marker([lat, lon]).addTo(map)
                .bindPopup(`<b style="color:#000;">${req.type}</b><br><span style="color:#333;">${req.weight}kg - ₹${req.rate}</span>`);
            markers.push(marker); bounds.push([lat, lon]);
        }
    });
    if(bounds.length > 0) map.fitBounds(bounds, {padding: [30, 30], maxZoom: 14});
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageBase64 = e.target.result;
            document.getElementById('image-preview').src = currentImageBase64;
            document.getElementById('image-preview').classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
}

function getLocation() {
    const coordsInput = document.getElementById('waste-coords');
    coordsInput.value = "Locating via Satellite...";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => { coordsInput.value = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`; showToast("Location locked!"); },
            () => { coordsInput.value = ""; showToast("Location access denied."); }
        );
    }
}

async function submitRequest() {
    const type = document.getElementById('waste-type').value;
    const weight = document.getElementById('waste-weight').value;
    const rate = document.getElementById('waste-rate').value; 
    const address = document.getElementById('waste-address').value;
    const coords = document.getElementById('waste-coords').value; 
    const city = document.getElementById('waste-city').value;
    const pincode = document.getElementById('waste-pincode').value;
    const username = document.getElementById('nav-username-display').innerText.trim();

    if (!weight || !rate || !address || !city || !pincode) return showToast("Please fill all details, including city and pincode.");

    const newRequest = {
        user_name: username,
        type: type,
        weight: parseFloat(weight),
        rate: parseFloat(rate),
        address: address,
        coords: coords,
        city: city,
        pincode: pincode,
        image_data: currentImageBase64 || "https://via.placeholder.com/80/222222/4ade80?text=No+Photo",
        status: 'Pending'
    };

    const { data, error } = await supabaseClient.from('waste_requests').insert([newRequest]).select();

    if (error) {
        console.error("DB Error:", error);
        return showToast("Error connecting to server.");
    }

    if (data && data.length > 0) wasteRequests.push(data[0]);

    document.getElementById('waste-weight').value = ''; document.getElementById('waste-rate').value = ''; 
    document.getElementById('waste-address').value = ''; document.getElementById('waste-coords').value = ''; 
    document.getElementById('waste-city').value = ''; document.getElementById('waste-pincode').value = '';
    document.getElementById('image-preview').classList.add('hidden'); currentImageBase64 = "";
    
    showToast("Waste posted to live network!");
    renderGiverRequests(username);
}

async function acceptPickup(id) {
    const collectorName = document.getElementById('nav-username-display').innerText.trim();

    const { error } = await supabaseClient.from('waste_requests').update({ status: 'Accepted', collector_name: collectorName }).eq('id', id);

    if (error) return showToast("Error updating database.");

    const index = wasteRequests.findIndex(req => req.id === id);
    if (index !== -1) {
        wasteRequests[index].status = 'Accepted';
        wasteRequests[index].collector_name = collectorName;
        showToast("Pickup Accepted! Added to your Route.");
        renderCollectorPickups();
    }
}

async function completePickup(id) {
    const { error } = await supabaseClient.from('waste_requests').update({ status: 'Completed' }).eq('id', id);
    if (error) return showToast("Error updating database.");

    const index = wasteRequests.findIndex(req => req.id === id);
    if (index !== -1) {
        wasteRequests[index].status = 'Completed';
        showToast("Pickup Completed! Resident Notified.");
        renderCollectorPickups();
        
        const city = document.getElementById('profile-city').value.trim();
        if (city) updateAreaImpact(city);
    }
}

function calculateImpact(history) {
    let earned = 0; let kg = 0;
    const earningsByType = {}; 

    history.forEach(req => { 
        const rate = parseFloat(req.rate);
        const weight = parseFloat(req.weight);
        earned += rate; 
        kg += weight; 
        
        if (!earningsByType[req.type]) {
            earningsByType[req.type] = { amount: 0, weight: 0 };
        }
        earningsByType[req.type].amount += rate;
        earningsByType[req.type].weight += weight;
    });
    
    let co2 = (kg * 2.5).toFixed(1); 
    
    document.getElementById('stat-earned').innerText = `₹${earned}`;
    document.getElementById('stat-kg').innerText = kg;
    document.getElementById('stat-co2').innerText = co2;

    renderEarningsBreakdown(earningsByType);
}

function renderEarningsBreakdown(earningsByType) {
    const container = document.getElementById('my-earnings-breakdown');
    if (!container) return;

    if (Object.keys(earningsByType).length === 0) {
        container.innerHTML = "<p style='color:#aaa; font-size:0.85rem; width: 100%;'>No completed pickups yet to show a breakdown.</p>";
        return;
    }

    const typeConfig = {
        'Paper': { icon: 'fa-newspaper', color: '#f6e58d' },
        'Plastics': { icon: 'fa-bottle-water', color: '#ffbe76' },
        'E-Waste': { icon: 'fa-plug', color: '#ff7979' },
        'Metals': { icon: 'fa-can-food', color: '#badc58' },
        'Glass': { icon: 'fa-wine-glass', color: '#7ed6df' }
    };

    let html = "";
    for (const [type, data] of Object.entries(earningsByType)) {
        const config = typeConfig[type] || { icon: 'fa-recycle', color: '#56CCF2' };
        html += `
            <div class="fade-in" style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); flex: 1; min-width: 130px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <i class="fa-solid ${config.icon}" style="color: ${config.color}; font-size: 1.2rem;"></i>
                    <span style="color: #ddd; font-size: 0.9rem; font-weight: 600;">${type}</span>
                </div>
                <h4 style="color: #4ade80; margin: 0 0 2px 0; font-size: 1.3rem;">₹${data.amount.toFixed(0)}</h4>
                <p style="color: #aaa; font-size: 0.75rem; margin: 0;">${data.weight.toFixed(1)} kg recycled</p>
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderGiverRequests(username) {
    const activeList = document.getElementById('my-requests-list');
    const historyList = document.getElementById('my-history-list');
    
    const userReqs = wasteRequests.filter(req => req.user_name === username);
    const activeReqs = userReqs.filter(req => req.status !== 'Completed');
    const historyReqs = userReqs.filter(req => req.status === 'Completed');

    calculateImpact(historyReqs);

    activeList.innerHTML = activeReqs.length === 0 ? "<p style='color:#aaa; text-align:center;'>No active requests.</p>" : "";
    activeReqs.forEach(req => {
        const statusColor = req.status === 'Pending' ? '#f59e0b' : '#56CCF2';
        const coordsHTML = req.coords ? `<br><i class="fa-solid fa-satellite" style="font-size:0.8rem; color:#56CCF2;"></i> <span style="font-size:0.85rem; color:#56CCF2;">${req.coords}</span>` : '';
        const collectorHTML = req.collector_name ? `<p style="color: #4ade80; font-size: 0.85rem; margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);"><i class="fa-solid fa-truck"></i> Accepted by Recycler: <strong>${req.collector_name}</strong></p>` : '';
        
        activeList.innerHTML += `<div class="list-item fade-in" style="cursor: pointer;" onclick="openRequestModal(${req.id})"><img src="${req.image_data}" class="item-image" alt="Waste"><div class="item-details"><h4>${req.type} (${req.weight} kg) - <span style="color:#fff;">Asking: ₹${req.rate}</span></h4><p><i class="fa-solid fa-location-dot"></i> ${req.address}, ${req.city || ''} ${req.pincode ? '- '+req.pincode : ''} ${coordsHTML}</p><p>Status: <strong style="color: ${statusColor}">${req.status}</strong></p>${collectorHTML}</div></div>`;
    });

    historyList.innerHTML = historyReqs.length === 0 ? "<p style='color:#aaa; text-align:center;'>No past receipts.</p>" : "";
    historyReqs.forEach(req => {
        const coordsHTML = req.coords ? `<br><i class="fa-solid fa-satellite" style="font-size:0.8rem; color:#56CCF2;"></i> <span style="font-size:0.85rem; color:#56CCF2;">${req.coords}</span>` : '';
        const collectorHTML = req.collector_name ? `<p style="color: #4ade80; font-size: 0.85rem; margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);"><i class="fa-solid fa-handshake"></i> Recycled securely by: <strong>${req.collector_name}</strong></p>` : '';
        
        historyList.innerHTML += `<div class="list-item fade-in" style="opacity: 0.7; cursor: pointer;" onclick="openRequestModal(${req.id})"><img src="${req.image_data}" class="item-image" alt="Waste"><div class="item-details"><h4 style="color:#aaa;">${req.type} (${req.weight} kg) - Paid: ₹${req.rate}</h4><p><i class="fa-solid fa-location-dot"></i> ${req.address}, ${req.city || ''} ${req.pincode ? '- '+req.pincode : ''} ${coordsHTML}</p><p>Status: <strong style="color: #4ade80;"><i class="fa-solid fa-check-double"></i> Completed</strong></p>${collectorHTML}</div></div>`;
    });
}

function renderCollectorPickups() {
    const availList = document.getElementById('available-pickups-list');
    const activeRouteList = document.getElementById('my-routes-list');
    const cityFilterInput = document.getElementById('city-filter');
    const cityFilter = cityFilterInput ? cityFilterInput.value.toLowerCase() : "";
    const typeFilterInput = document.getElementById('type-filter');
    const typeFilter = typeFilterInput ? typeFilterInput.value : "";

    let pendingReqs = wasteRequests.filter(req => req.status === 'Pending');
    const acceptedReqs = wasteRequests.filter(req => req.status === 'Accepted');
    
    if (cityFilter) pendingReqs = pendingReqs.filter(req => req.city && req.city.toLowerCase().includes(cityFilter));
    if (typeFilter) pendingReqs = pendingReqs.filter(req => req.type === typeFilter);
    
    document.getElementById('pickup-count').innerText = pendingReqs.length;
    updateMapMarkers(); 

    availList.innerHTML = pendingReqs.length === 0 ? "<p style='color:#aaa; text-align:center;'>No available pickups match your criteria.</p>" : "";
    pendingReqs.forEach(req => {
        const coordsHTML = req.coords ? `<br><i class="fa-solid fa-satellite" style="font-size:0.8rem; color:#56CCF2;"></i> <span style="font-size:0.85rem; color:#56CCF2;">${req.coords}</span>` : '';
        
        availList.innerHTML += `<div class="list-item fade-in" style="cursor: pointer;" onclick="openRequestModal(${req.id})"><img src="${req.image_data}" class="item-image" alt="Waste"><div class="item-details"><h4>${req.type} (${req.weight} kg) - <span style="color:#fff;">Expected: ₹${req.rate}</span></h4><p><i class="fa-solid fa-location-dot"></i> ${req.address}, ${req.city || ''} ${req.pincode ? '- '+req.pincode : ''} ${coordsHTML}</p><p><i class="fa-solid fa-user"></i> ${req.user_name}</p></div><div style="display:flex; align-items:center;"><button class="btn-gradient" style="padding: 10px 15px; font-size: 0.8rem;" onclick="event.stopPropagation(); acceptPickup(${req.id})">Accept Route</button></div></div>`;
    });

    activeRouteList.innerHTML = acceptedReqs.length === 0 ? "<p style='color:#aaa; text-align:center;'>You have no active routes.</p>" : "";
    acceptedReqs.forEach(req => {
        const coordsHTML = req.coords ? `<br><i class="fa-solid fa-satellite" style="font-size:0.8rem; color:#56CCF2;"></i> <span style="font-size:0.85rem; color:#56CCF2;">${req.coords}</span>` : '';
        
        activeRouteList.innerHTML += `<div class="list-item fade-in" style="border-left: 4px solid #56CCF2; cursor: pointer;" onclick="openRequestModal(${req.id})"><img src="${req.image_data}" class="item-image" alt="Waste"><div class="item-details"><h4>${req.type} (${req.weight} kg) - <span style="color:#fff;">Pay: ₹${req.rate}</span></h4><p><i class="fa-solid fa-location-dot"></i> ${req.address}, ${req.city || ''} ${req.pincode ? '- '+req.pincode : ''} ${coordsHTML}</p><p style="color:#56CCF2;"><i class="fa-solid fa-truck-fast"></i> In Progress</p></div><div style="display:flex; align-items:center;"><button class="btn-gradient" style="padding: 10px 15px; font-size: 0.8rem; background: linear-gradient(to right, #4ade80, #059669);" onclick="event.stopPropagation(); completePickup(${req.id})">Mark Completed</button></div></div>`;
    });
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div'); toast.className = 'toast'; toast.innerText = message;
    container.appendChild(toast); setTimeout(() => toast.remove(), 3000);
}