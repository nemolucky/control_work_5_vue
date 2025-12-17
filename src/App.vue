<template>
	<div id="app">
		<header class="app-header">
			<div class="header-content">
				<h1>Генератор цветовых палитр</h1>
				<p>Создание, управление и экспорт</p>
			</div>
            <nav class="main-nav">
                <router-link to="/" class="nav-link">Генератор</router-link>
                <router-link to="/library" class="nav-link">Библиотека палитр</router-link>
            </nav>
		</header>

		<main class="main-content">
			<router-view />
		</main>

		<footer class="app-footer">
			<p>&copy; 2025 Vue 3 Color Palette Generator</p>
		</footer>
	</div>
</template>

<script>
import { onMounted, provide, ref, watch } from 'vue'
import tinycolor from 'tinycolor2'

export default {
	name: 'App',

	setup() {
		const currentPalette = ref([])
		const setPalette = newPalette => {
			currentPalette.value = newPalette
		}

		provide('currentPalette', currentPalette)
		provide('setPalette', setPalette)

		onMounted(() => {
			const urlParams = new URLSearchParams(window.location.search)
			const paletteFromUrl = urlParams.get('palette')

			if (paletteFromUrl) {
				const colors = paletteFromUrl.split(',').map(hex => `#${hex}`)
				currentPalette.value = colors.map(hex => ({
					hex,
					hsl: tinycolor(hex).toHsl(),
					locked: false,
				}))
				return // Do not load from localStorage if palette is from URL
			}

			const savedPalette = localStorage.getItem('palette')
			if (savedPalette) {
				try {
					const parsedPalette = JSON.parse(savedPalette)
					if (Array.isArray(parsedPalette)) {
						// Data migration for old format
						currentPalette.value = parsedPalette.map(color => {
							if (color.hex && !color.hsl) {
								return {
									...color,
									hsl: tinycolor(color.hex).toHsl(),
								}
							}
							return color
						})
					}
				} catch (e) {
					console.error(
						'Error parsing saved palette from localStorage in App.vue:',
						e
					)
				}
			}
		})

		watch(
			currentPalette,
			newPalette => {
				localStorage.setItem('palette', JSON.stringify(newPalette))
			},
			{ deep: true }
		)

		return {}
	},
}
</script>

<style>
/* Глобальные стили */
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

body {
	font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	background-color: #f0f2f5; /* Lighter background */
	color: #333;
	line-height: 1.6;
}

#app {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
}

/* Cтили шапки */
.app-header {
	background: linear-gradient(135deg, #4a00e0 0%, #8e2de2 100%); /* Deeper, more vibrant gradient */
	color: white;
	padding: 1.5rem 1rem; /* Adjusted padding */
	text-align: center;
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); /* More pronounced shadow */
}

.header-content h1 {
	margin-bottom: 0.25rem; /* Reduced margin */
	font-size: 2.2rem; /* Slightly smaller for better fit */
	font-weight: 700;
	letter-spacing: 0.05em;
}

.header-content p {
	opacity: 0.9;
	font-size: 1em; /* Adjusted font size */
	margin-bottom: 1rem;
}

.main-nav {
    margin-top: 0.5rem; /* Adjusted margin */
}

.nav-link {
    color: rgba(255, 255, 255, 0.8); /* Slightly less bright default color */
    text-decoration: none;
    margin: 0 15px;
    font-size: 1.05rem; /* Adjusted font size */
    padding-bottom: 5px;
    transition: all 0.3s ease;
    font-weight: 500;
}

.nav-link:hover, .nav-link.router-link-active {
    color: white; /* Brighten on hover/active */
    border-bottom: 2px solid white;
}


/* Основное содержимое */
.main-content {
	flex: 1;
	padding: 2rem 1rem; /* Adjusted padding */
	max-width: 1200px;
	margin: 0 auto;
	width: 100%;
}

/* Подвал */
.app-footer {
	background-color: #2c3e50; /* Darker footer */
	color: rgba(255, 255, 255, 0.7); /* Softer white */
	text-align: center;
	padding: 1rem;
	margin-top: auto;
	font-size: 0.9em;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .app-header {
        padding: 1rem 0.5rem;
    }
    .header-content h1 {
        font-size: 1.8rem;
    }
    .header-content p {
        font-size: 0.9em;
    }
    .nav-link {
        margin: 0 10px;
        font-size: 1em;
    }
    .main-content {
        padding: 1.5rem 0.5rem;
    }
}
</style>
