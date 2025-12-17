<template>
	<div class="palette-generator">
		<h2>Генератор цветовых палитр</h2>

		<div class="controls">
			<button @click="generateRandomPalette" class="generate-button primary-button">
				Случайная палитра
			</button>

			<router-link to="/library" class="generate-button secondary-button"
				>Загрузить из библиотеки</router-link
			>

			<div class="settings-group">
				<label for="base-color" class="setting-label">Базовый цвет:</label>
				<input
					type="color"
					id="base-color"
					v-model="baseColor"
					class="setting-color-input"
				/>

				<label for="palette-type" class="setting-label">Тип палитры:</label>
				<select id="palette-type" v-model="paletteType" class="setting-select">
					<option value="analogous">Аналогичная</option>
					<option value="monochromatic">Монохромная</option>
					<option value="triadic">Триада</option>
					<option value="complementary">Комплементарная</option>
				</select>
			</div>

			<div class="settings-group">
				<label for="palette-mood" class="setting-label"
					>Настроение палитры:</label
				>
				<select id="palette-mood" v-model="paletteMood" class="setting-select">
					<option value="none">Нет</option>
					<option value="calm">Спокойные</option>
					<option value="energetic">Энергичные</option>
					<option value="professional">Профессиональные</option>
				</select>
			</div>

			<div class="settings-group">
				<label for="num-colors" class="setting-label"
					>Количество цветов:
				</label>
				<select
					id="num-colors"
					v-model.number="numColors"
					class="setting-select"
				>
					<option>3</option>
					<option>5</option>
					<option>7</option>
				</select>

				<label class="setting-label">Формат: </label>
				<button
					@click="colorFormat = 'hex'"
					:class="{ active: colorFormat === 'hex' }"
					class="format-button"
				>
					HEX
				</button>
				<button
					@click="colorFormat = 'rgb'"
					:class="{ active: colorFormat === 'rgb' }"
					class="format-button"
				>
					RGB
				</button>
			</div>
		</div>

		<div class="palette">
			<div
				v-for="(color, index) in palette"
				:key="index"
				class="color-card"
				:style="{ backgroundColor: color.hex }"
				@click="copyToClipboard(displayColor(color))"
			>
				<div class="color-info" :style="{ color: getContrastColor(color.hex) }">
					<span>{{ displayColor(color) }}</span>
					<button
						@click.stop="toggleLock(index)"
						class="lock-button"
						:style="{ color: getContrastColor(color.hex) }"
					>
						{{ color.locked ? '🔒' : '🔓' }}
					</button>
				</div>
			</div>
		</div>

		<div class="preview">
			<h3>Превью</h3>
			<div class="preview-layout" :style="{ '--preview-bg': previewBg }">
				<div
					class="preview-sidebar"
					:style="{
						backgroundColor: palette[0]?.hex,
						color: getContrastColor(palette[0]?.hex),
					}"
				>
					<div class="preview-sidebar-header">
						<svg
							class="preview-icon"
							viewBox="0 0 24 24"
							:fill="getContrastColor(palette[0]?.hex)"
						>
							<path
								d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
							/>
						</svg>
						<span>AppName</span>
					</div>
					<ul class="preview-nav">
						<li
							:style="{
								backgroundColor: palette[1]
									? tinycolor(palette[1].hex).darken(10).toHexString()
									: '',
							}"
						>
							<svg
								class="preview-icon"
								viewBox="0 0 24 24"
								:fill="getContrastColor(palette[1]?.hex)"
							>
								<path
									d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
								/>
							</svg>
							<span>Dashboard</span>
						</li>
						<li>
							<svg
								class="preview-icon"
								viewBox="0 0 24 24"
								:fill="getContrastColor(palette[0]?.hex)"
							>
								<path
									d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
								/>
							</svg>
							<span>Profile</span>
						</li>
						<li>
							<svg
								class="preview-icon"
								viewBox="0 0 24 24"
								:fill="getContrastColor(palette[0]?.hex)"
							>
								<path
									d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"
								/>
							</svg>
							<span>Settings</span>
						</li>
					</ul>
				</div>
				<div class="preview-main">
					<div
						class="preview-header"
						:style="{
							backgroundColor: palette[1]?.hex,
							color: getContrastColor(palette[1]?.hex),
						}"
					>
						<h2>Dashboard</h2>
						<button
							class="preview-button"
							:style="{
								backgroundColor: palette[2]?.hex,
								color: getContrastColor(palette[2]?.hex),
							}"
						>
							New Report
						</button>
					</div>
					<div class="preview-content-grid">
						<div
							class="preview-content-card"
							:style="{
								backgroundColor: palette[3]
									? tinycolor(palette[3].hex).setAlpha(0.2).toRgbString()
									: '',
								borderColor: palette[3]?.hex,
							}"
						>
							<h4 :style="{ color: palette[0]?.hex }">Sales</h4>
							<p :style="{ color: palette[1]?.hex }">1,234 units</p>
							<div
								class="preview-progress-bar"
								:style="{ backgroundColor: palette[3]?.hex }"
							></div>
						</div>
						<div
							class="preview-content-card"
							:style="{
								backgroundColor: palette[4]
									? tinycolor(palette[4].hex).setAlpha(0.2).toRgbString()
									: '',
								borderColor: palette[4]?.hex,
							}"
						>
							<h4 :style="{ color: palette[0]?.hex }">Revenue</h4>
							<p :style="{ color: palette[1]?.hex }">$12,345</p>
							<div
								class="preview-progress-bar"
								:style="{ backgroundColor: palette[4]?.hex }"
							></div>
						</div>
						<div
							class="preview-content-card"
							:style="{
								backgroundColor: palette[2]
									? tinycolor(palette[2].hex).setAlpha(0.2).toRgbString()
									: '',
								borderColor: palette[2]?.hex,
							}"
						>
							<h4 :style="{ color: palette[0]?.hex }">Users</h4>
							<p :style="{ color: palette[1]?.hex }">567</p>
							<div
								class="preview-progress-bar"
								:style="{ backgroundColor: palette[2]?.hex }"
							></div>
						</div>
					</div>
				</div>
			</div>
			<div class="preview-controls">
				<button @click="previewBg = '#ffffff'" class="preview-bg-button">
					Светлый фон
				</button>
				<button @click="previewBg = '#333333'" class="preview-bg-button">
					Темный фон
				</button>
			</div>
		</div>

		<div class="analysis-container">
			<div class="accessibility-section">
				<h3>Анализ доступности (WCAG)</h3>
				<div class="accessibility-grid">
					<div
						v-for="(color, index) in palette"
						:key="`wcag-${index}`"
						class="accessibility-card"
					>
						<div
							class="color-swatch"
							:style="{ backgroundColor: color.hex }"
						></div>
						<div class="color-details">
							<h4>{{ displayColor(color) }}</h4>
							<div class="contrast-info">
								<p>На светлом фоне (#FFFFFF):</p>
								<span
									>Контраст:
									{{
										getContrastRatio(color.hex, '#FFFFFF').toFixed(2)
									}}</span
								>
								<span :class="getAccessibilityClass(color.hex, '#FFFFFF')">{{
									getAccessibilityLevel(color.hex, '#FFFFFF')
								}}</span>
							</div>
							<div class="contrast-info">
								<p>На темном фоне (#000000):</p>
								<span
									>Контраст:
									{{
										getContrastRatio(color.hex, '#000000').toFixed(2)
									}}</span
								>
								<span :class="getAccessibilityClass(color.hex, '#000000')">{{
									getAccessibilityLevel(color.hex, '#000000')
								}}</span>
							</div>
							<div class="contrast-info" v-if="previewBg">
								<p>На фоне превью ({{ previewBg.toUpperCase() }}):</p>
								<span
									>Контраст:
									{{
										getContrastRatio(color.hex, previewBg).toFixed(2)
									}}</span
								>
								<span :class="getAccessibilityClass(color.hex, previewBg)">{{
									getAccessibilityLevel(color.hex, previewBg)
								}}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<ColorWheel :palette="palette" />
		</div>

		<div class="export-section">
			<h3>Экспорт палитры</h3>
			<div class="export-controls">
				<select v-model="exportFormat" class="setting-select">
					<option value="css">CSS Variables</option>
					<option value="scss">SCSS Variables</option>
					<option value="tailwind">Tailwind CSS Config</option>
				</select>
				<button @click="copyExportCode" class="generate-button primary-button">
					Копировать код
				</button>
				<button
					@click="sharePalette"
					class="generate-button secondary-button"
				>
					Поделиться
				</button>
			</div>
			<pre
				class="export-code-block"
			><code>{{ generatedExportCode }}</code></pre>
		</div>

		<transition name="fade">
			<div
				v-if="notification.visible"
				class="notification"
				:class="{ 'notification-error': notification.type === 'error' }"
			>
				{{ notification.message }}
			</div>
		</transition>
	</div>
</template>

<script>
import tinycolor from 'tinycolor2'
import { computed, inject, onMounted, ref, watch } from 'vue'
import ColorWheel from './ColorWheel.vue'

export default {
	name: 'ColorPaletteGenerator',
	components: {
		ColorWheel,
	},
	setup(props, { emit }) {
		const palette = inject('currentPalette')
		const setPalette = inject('setPalette')
		const numColors = ref(3)
		const colorFormat = ref('hex')
		const previewBg = ref('#ffffff')
		const notification = ref({ visible: false, message: '', type: 'success' })

		const baseColor = ref('#3498db') // Default blue for base generation
		const paletteType = ref('analogous') // Default palette type
		const paletteMood = ref('none')
		const exportFormat = ref('css') // Default export format

		// Helper to determine contrasting text color (black or white)
		const getContrastColor = hexcolor => {
			if (!hexcolor) return 'black' // Default to black if no color
			const tc = tinycolor(hexcolor)
			return tc.isLight() ? 'black' : 'white'
		}

		// WCAG Contrast and Accessibility
		const getContrastRatio = (color1, color2) => {
			if (!color1 || !color2) return 0
			return tinycolor.readability(color1, color2)
		}

		const getAccessibilityLevel = (color1, color2) => {
			if (!color1 || !color2) return 'N/A'
			const ratio = getContrastRatio(color1, color2)
			if (ratio >= 7.0) return 'AAA'
			if (ratio >= 4.5) return 'AA'
			return 'Недостаточно'
		}

		const getAccessibilityClass = (color1, color2) => {
			const level = getAccessibilityLevel(color1, color2)
			if (level === 'AAA') return 'wcag-aaa'
			if (level === 'AA') return 'wcag-aa'
			if (level === 'Недостаточно') return 'wcag-fail'
			return ''
		}

		const generateRandomHexColor = () => {
			return tinycolor.random().toHexString()
		}

		const generatePaletteFromBase = (base) => {
			if (numColors.value < 1) {
				numColors.value = 1
			}
			const tcBaseColor = tinycolor(base || baseColor.value)
			let generatedColors = []

			switch (paletteType.value) {
				case 'monochromatic':
					generatedColors = tcBaseColor.monochromatic(numColors.value)
					break
				case 'analogous':
					generatedColors = tcBaseColor.analogous(numColors.value)
					break
				case 'triadic':
					generatedColors = tcBaseColor.triad()
					// If more colors are requested, derive them from the triadic base
					while (generatedColors.length < numColors.value) {
						generatedColors.push(
							generatedColors[generatedColors.length % 3].lighten(10)
						)
					}
					break
				case 'complementary':
					// complementary often gives 2 colors, splitcomplementary gives 3-4
					// We'll start with complement and splitcomplement to get more base variety
					let baseComplementary = [
						tcBaseColor,
						tcBaseColor.complement(),
						...tcBaseColor.splitcomplement(),
					]
					// Ensure unique base colors and take up to 4
					baseComplementary = Array.from(
						new Set(baseComplementary.map(c => c.toHexString()))
					).map(hex => tinycolor(hex))

					generatedColors = baseComplementary.slice(0, numColors.value)

					// If more colors are requested, derive them
					while (generatedColors.length < numColors.value) {
						const lastColor =
							generatedColors[generatedColors.length % baseComplementary.length]
						generatedColors.push(lastColor.darken(10)) // Alternate between lighten/darken
					}
					break
				default:
					generatedColors = tcBaseColor.monochromatic(numColors.value)
					break
			}

			const finalPalette = generatedColors
				.slice(0, numColors.value)
				.map((tc, index) => {
					const existingColor = palette.value[index]
					const color = tinycolor(tc)
					if (existingColor && existingColor.locked) {
						return existingColor
					}
					return {
						hex: color.toHexString(),
						hsl: color.toHsl(),
						locked: false,
					}
				})

			setPalette(finalPalette)
		}

		const generatePaletteFromMood = () => {
			const moodColors = {
				calm: ['#6a8d92', '#a0c1b8', '#dadedf', '#f2e8c4', '#f5b461'],
				energetic: ['#ff4e50', '#fcab10', '#f8b400', '#f4d35e', '#a8d0e6'],
				professional: ['#2c3e50', '#34495e', '#95a5a6', '#bdc3c7', '#ecf0f1'],
			}

			if (paletteMood.value in moodColors) {
				const moodBaseColors = moodColors[paletteMood.value]
				baseColor.value =
					moodBaseColors[Math.floor(Math.random() * moodBaseColors.length)]
			}
		}

		const generateRandomPalette = () => {
			const randomColor = generateRandomHexColor()
			baseColor.value = randomColor
		}

		const toggleLock = index => {
			if (palette.value[index]) {
				const newPalette = [...palette.value]
				newPalette[index].locked = !newPalette[index].locked
				setPalette(newPalette)
			}
		}

		const showNotification = (message, type = 'success') => {
			notification.value = { visible: true, message, type }
			setTimeout(() => {
				notification.value.visible = false
				notification.value.type = 'success' // Reset type
			}, 2000)
		}

		const hexToRgb = hex => {
			const tc = tinycolor(hex)
			return tc.toRgbString()
		}

		const displayColor = color => {
			if (!color || !color.hex) return '' // Handle undefined color
			if (colorFormat.value === 'rgb') {
				return hexToRgb(color.hex)
			}
			return color.hex.toUpperCase()
		}

		const copyToClipboard = async text => {
			try {
				await navigator.clipboard.writeText(text)
				showNotification(`Скопировано: ${text}`)
			} catch (err) {
				showNotification('Не удалось скопировать', 'error')
			}
		}

		const sharePalette = () => {
			const colors = palette.value.map(c => c.hex.substring(1)).join(',')
			const url = `${window.location.origin}?palette=${colors}`
			copyToClipboard(url)
			showNotification('Ссылка на палитру скопирована в буфер обмена')
		}

		// Export Logic
		const generatedExportCode = computed(() => {
			let code = ''
			if (!palette.value || palette.value.length === 0) return ''

			const colorNames = [
				'primary',
				'secondary',
				'accent',
				'neutral',
				'success',
				'warning',
				'error',
				'info',
				'dark',
				'light',
				'one',
				'two',
				'three',
				'four',
				'five',
				'six',
				'seven',
			]

			if (exportFormat.value === 'css') {
				code += ':root {\n'
				palette.value.forEach((color, index) => {
					const name = colorNames[index] || `color-${index + 1}`
					code += `  --${name}: ${color.hex};\n`
				})
				code += '}\n'
			} else if (exportFormat.value === 'scss') {
				palette.value.forEach((color, index) => {
					const name = colorNames[index] || `color-${index + 1}`
					code += `$${name}: ${color.hex};\n`
				})
			} else if (exportFormat.value === 'tailwind') {
				code += 'module.exports = {\n'
				code += '  theme: {\n'
				code += '    extend: {\n'
				code += '      colors: {\n'
				palette.value.forEach((color, index) => {
					const name = colorNames[index] || `color${index + 1}`
					code += `        ${name}: '${color.hex}',\n`
				})
				code += '      },\n'
				code += '    },\n'
				code += '  },\n'
				code += '};\n'
			}
			return code
		})

		const copyExportCode = () => {
			copyToClipboard(generatedExportCode.value)
		}

		// Watchers for baseColor, paletteType, and numColors to regenerate palette
		watch([baseColor, paletteType], () => {
			generatePaletteFromBase()
		})

		watch(paletteMood, () => {
			generatePaletteFromMood()
		})

		watch(numColors, (newVal, oldVal) => {
			if (newVal !== oldVal) {
				// Re-evaluate the palette based on the new number of colors
				generatePaletteFromBase()
			}
		})

		onMounted(() => {
			if (!palette.value || palette.value.length === 0) {
				generatePaletteFromBase()
			}
		})

		return {
			palette,
			numColors,
			colorFormat,
			previewBg,
			notification,
			baseColor,
			paletteType,
			paletteMood,
			exportFormat, // Expose exportFormat
			generateRandomPalette,
			generatePaletteFromBase,
			toggleLock,
			copyToClipboard,
			displayColor,
			getContrastColor,
			getContrastRatio,
			getAccessibilityLevel,
			getAccessibilityClass,
			generatedExportCode, // Expose computed property
			copyExportCode, // Expose copy function
			sharePalette,
			tinycolor,
		}
	},
}
</script>

<style scoped>
.palette-generator {
	max-width: 960px; /* Increased max-width */
	margin: 30px auto; /* More vertical spacing */
	padding: 30px;
	background-color: #fff;
	border-radius: 12px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); /* Softer shadow */
	font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	color: #333;
}

h2 {
	text-align: center;
	color: #555;
	margin-bottom: 30px;
	font-size: 2em;
}

.controls {
	display: flex;
	flex-wrap: wrap; /* Allow wrapping */
	justify-content: center;
	align-items: center;
	gap: 20px; /* Increased gap */
	margin-bottom: 30px;
	padding: 15px;
	background-color: #f8f9fa;
	border-radius: 8px;
}

.generate-button {
	padding: 12px 25px;
	background-color: #007bff;
	color: white;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 1.1em;
	font-weight: bold;
	transition: background-color 0.2s ease, transform 0.2s ease;
	flex-shrink: 0; /* Prevent shrinking */
}

.generate-button:hover {
	background-color: #0056b3;
	transform: translateY(-2px);
}

.settings-group {
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
}

.setting-label {
	font-weight: 600;
	color: #555;
	white-space: nowrap; /* Prevent wrapping for label */
}

.setting-select,
.format-button {
	padding: 10px 15px;
	border: 1px solid #ccc;
	border-radius: 6px;
	font-size: 1em;
	cursor: pointer;
	transition: all 0.2s ease;
	background-color: white;
	color: #333;
}

.setting-select:focus,
.format-button:focus {
	border-color: #007bff;
	box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
	outline: none;
}

.format-button.active {
	background-color: #007bff;
	color: white;
	border-color: #007bff;
}

.format-button:hover:not(.active) {
	background-color: #e2e6ea;
}

.palette {
	display: flex;
	min-height: 200px; /* Ensure a minimum height */
	margin-bottom: 40px;
	border-radius: 8px;
	overflow: hidden; /* Ensure rounded corners for children */
	box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05); /* Lighter shadow for palette */
}

.color-card {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	cursor: pointer;
	position: relative;
	transition: all 0.2s ease;
	border-right: 1px solid rgba(255, 255, 255, 0.2); /* Subtle separator */
}

.color-card:last-child {
	border-right: none;
}

.color-card:hover {
	flex-grow: 1.2; /* Slightly expand on hover */
}

.color-info {
	background: rgba(0, 0, 0, 0.4); /* Darker overlay for better contrast */
	padding: 10px 15px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 0.9em;
	font-weight: 600;
}

.lock-button {
	background: none;
	border: none;
	font-size: 1.2em;
	cursor: pointer;
	opacity: 0.8;
	transition: opacity 0.2s ease;
}

.lock-button:hover {
	opacity: 1;
	transform: scale(1.1);
}

.preview {
	margin-top: 40px;
	padding: 25px;
	border: 1px solid #e0e0e0;
	border-radius: 12px;
	background-color: #fdfdfd;
	box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
}

.preview h3 {
	margin-top: 0;
	margin-bottom: 20px;
	color: #555;
	text-align: center;
}

.preview-layout {
	display: flex;
	border-radius: 8px;
	overflow: hidden;
	background-color: var(--preview-bg);
	min-height: 400px;
	box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.preview-sidebar {
	width: 200px;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 30px;
}

.preview-sidebar-header {
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 1.2em;
	font-weight: bold;
}

.preview-icon {
	width: 24px;
	height: 24px;
}

.preview-nav {
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.preview-nav li {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px;
	border-radius: 6px;
	cursor: pointer;
	transition: background-color 0.2s;
}

.preview-nav li:hover {
	background-color: rgba(255, 255, 255, 0.1);
}

.preview-main {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.preview-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px;
}

.preview-header h2 {
	margin: 0;
	font-size: 1.8em;
}

.preview-button {
	padding: 10px 20px;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-weight: bold;
	transition: all 0.2s ease;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-button:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preview-content-grid {
	flex: 1;
	padding: 20px;
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 20px;
}

.preview-content-card {
	padding: 20px;
	border-radius: 8px;
	border: 2px solid;
}

.preview-content-card h4 {
	margin: 0 0 10px 0;
}

.preview-content-card p {
	margin: 0 0 15px 0;
	font-size: 1.5em;
	font-weight: bold;
}

.preview-progress-bar {
	height: 8px;
	border-radius: 4px;
	width: 70%;
}

.preview-controls {
	margin-top: 20px;
	display: flex;
	gap: 10px;
	justify-content: center;
}

.preview-bg-button {
	padding: 8px 15px;
	border: 1px solid #ccc;
	border-radius: 6px;
	background-color: white;
	cursor: pointer;
	transition: all 0.2s ease;
}

.preview-bg-button:hover {
	background-color: #f0f0f0;
	border-color: #999;
}

/* Notification Styles */
.notification {
	position: fixed;
	bottom: 30px;
	left: 50%;
	transform: translateX(-50%);
	background: #28a745; /* Success color */
	color: white;
	padding: 12px 25px;
	border-radius: 8px;
	box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
	font-size: 1em;
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
}

.notification-error {
	background-color: #dc3545; /* Error color */
}
.analysis-container {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20px;
	align-items: start;
}
/* New styles for Accessibility Section */
.accessibility-section {
	margin-top: 40px;
	padding: 25px;
	border: 1px solid #e0e0e0;
	border-radius: 12px;
	background-color: #fdfdfd;
	box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
}

.accessibility-section h3 {
	margin-top: 0;
	margin-bottom: 20px;
	color: #555;
	text-align: center;
}

.accessibility-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 20px;
}

.accessibility-card {
	display: flex;
	align-items: flex-start;
	padding: 15px;
	border: 1px solid #eee;
	border-radius: 8px;
	background-color: #fff;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.color-swatch {
	width: 50px;
	height: 50px;
	border-radius: 4px;
	flex-shrink: 0;
	margin-right: 15px;
	border: 1px solid rgba(0, 0, 0, 0.1);
}

.color-details {
	flex-grow: 1;
}

.color-details h4 {
	margin-top: 0;
	margin-bottom: 10px;
	font-size: 1.1em;
	color: #333;
}

.contrast-info {
	font-size: 0.9em;
	line-height: 1.4;
	margin-bottom: 8px;
}

.contrast-info p {
	margin: 0;
	font-weight: 500;
	color: #666;
}

.contrast-info span {
	display: inline-block;
	margin-left: 5px;
	padding: 3px 8px;
	border-radius: 4px;
	font-weight: bold;
}

.wcag-aaa {
	background-color: #28a745;
	color: white;
}

.wcag-aa {
	background-color: #ffc107;
	color: #333;
}

.wcag-fail {
	background-color: #dc3545;
	color: white;
}

/* Export Section Styles */
.export-section {
	margin-top: 40px;
	padding: 25px;
	border: 1px solid #e0e0e0;
	border-radius: 12px;
	background-color: #fdfdfd;
	box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
}

.export-section h3 {
	text-align: center;
	color: #555;
	margin-bottom: 20px;
}

.export-controls {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 15px;
	margin-bottom: 20px;
}

.export-code-block {
	background-color: #e9ecef;
	padding: 15px;
	border-radius: 8px;
	white-space: pre-wrap; /* Preserve whitespace and wrap long lines */
	word-break: break-all; /* Break words to prevent overflow */
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier,
		monospace;
	font-size: 0.9em;
	color: #333;
	max-height: 300px; /* Limit height */
	overflow-y: auto; /* Enable scrolling if content is long */
}
</style>
