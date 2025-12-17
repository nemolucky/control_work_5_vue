<template>
	<div class="palette-generator">
		<h2>Генератор цветовых палитр</h2>

		<div class="controls">
			<button
				@click="generateRandomPalette"
				class="generate-button primary-button"
			>
				Случайная палитра
			</button>

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
				<button
					@click="generatePaletteFromBase"
					class="generate-button secondary-button"
				>
					Сгенерировать по базе
				</button>
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
			<div class="preview-content" :style="{ backgroundColor: previewBg }">
				<h4 :style="{ color: palette[0]?.hex }">Заголовок</h4>
				<p :style="{ color: palette[1]?.hex }">
					Это пример текста, использующего цвета из вашей палитры.
				</p>
				<div
					class="preview-card"
					:style="{
						backgroundColor: palette[2]?.hex,
						color: getContrastColor(palette[2]?.hex),
					}"
				>
					Карточка
				</div>
				<button
					class="preview-button"
					:style="{
						backgroundColor: palette[3]?.hex,
						color: getContrastColor(palette[3]?.hex),
					}"
				>
					Кнопка
				</button>
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
								{{ getContrastRatio(color.hex, '#FFFFFF').toFixed(2) }}</span
							>
							<span :class="getAccessibilityClass(color.hex, '#FFFFFF')">{{
								getAccessibilityLevel(color.hex, '#FFFFFF')
							}}</span>
						</div>
						<div class="contrast-info">
							<p>На темном фоне (#000000):</p>
							<span
								>Контраст:
								{{ getContrastRatio(color.hex, '#000000').toFixed(2) }}</span
							>
							<span :class="getAccessibilityClass(color.hex, '#000000')">{{
								getAccessibilityLevel(color.hex, '#000000')
							}}</span>
						</div>
						<div class="contrast-info" v-if="previewBg">
							<p>На фоне превью ({{ previewBg.toUpperCase() }}):</p>
							<span
								>Контраст:
								{{ getContrastRatio(color.hex, previewBg).toFixed(2) }}</span
							>
							<span :class="getAccessibilityClass(color.hex, previewBg)">{{
								getAccessibilityLevel(color.hex, previewBg)
							}}</span>
						</div>
					</div>
				</div>
			</div>
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

export default {
	name: 'ColorPaletteGenerator',
	setup(props, { emit }) {
		const palette = ref([])
		const numColors = ref(5)
		const colorFormat = ref('hex')
		const previewBg = ref('#ffffff')
		const notification = ref({ visible: false, message: '', type: 'success' })

		const baseColor = ref('#3498db') // Default blue for base generation
		const paletteType = ref('analogous') // Default palette type
		const exportFormat = ref('css') // Default export format

		const injectedSetPalette = inject('setPalette') // Inject the setPalette function

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

		const generatePaletteFromBase = () => {
			// Ensure numColors is at least 1
			if (numColors.value < 1) {
				numColors.value = 1
			}

			const tcBaseColor = tinycolor(baseColor.value)
			let newColors = []

			// Add locked colors first
			const lockedColors = palette.value
				.filter(c => c.locked && c.hex)
				.map(c => c.hex)

			// Generate colors based on paletteType
			if (paletteType.value === 'monochromatic') {
				newColors = tcBaseColor.monochromatic(numColors.value)
			} else if (paletteType.value === 'analogous') {
				newColors = tcBaseColor.analogous(numColors.value)
			} else if (paletteType.value === 'triadic') {
				newColors = tcBaseColor.triad() // triad always returns 3 colors
				if (numColors.value > 3) {
					// Generate additional colors by slightly modifying existing ones
					for (let i = 0; i < numColors.value - 3; i++) {
						newColors.push(newColors[i % 3].lighten(10 * (i + 1)))
					}
				}
			} else if (paletteType.value === 'complementary') {
				newColors = tcBaseColor.complement().splitcomplement() // Start with complement and split complement
				if (numColors.value > 2) {
					// Generate additional colors by slightly modifying existing ones
					for (let i = 0; i < numColors.value - 2; i++) {
						newColors.push(newColors[i % 2].darken(10 * (i + 1)))
					}
				}
			} else {
				// Default to monochromatic if type is unknown or not handled
				newColors = tcBaseColor.monochromatic(numColors.value)
			}

			newColors = newColors.map(tc => ({
				hex: tc.toHexString(),
				locked: false,
			}))

			// Ensure the number of generated colors matches numColors
			while (newColors.length < numColors.value) {
				newColors.push({ hex: tcBaseColor.toHexString(), locked: false }) // Fill with base color if not enough generated
			}
			newColors = newColors.slice(0, numColors.value)

			// Combine locked colors with newly generated ones
			let finalPalette = []
			for (let i = 0; i < numColors.value; i++) {
				if (
					palette.value[i]?.locked &&
					lockedColors.includes(palette.value[i].hex)
				) {
					finalPalette.push(palette.value[i])
				} else {
					finalPalette.push(
						newColors.shift() || {
							hex: tcBaseColor.toHexString(),
							locked: false,
						}
					)
				}
			}
			palette.value = finalPalette

			// Re-apply locked status for colors that were originally locked and are still in the palette
			palette.value.forEach((color, index) => {
				if (lockedColors.includes(color.hex)) {
					color.locked = true
				}
			})
			injectedSetPalette(palette.value) // Use injected setPalette
		}

		const generateRandomPalette = () => {
			baseColor.value = generateRandomHexColor()
			generatePaletteFromBase()
		}

		const toggleLock = index => {
			if (palette.value[index]) {
				palette.value[index].locked = !palette.value[index].locked
				injectedSetPalette(palette.value) // Use injected setPalette
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

		// Expose method to set palette from external source
		const setPalette = newPaletteData => {
			palette.value = newPaletteData
			numColors.value = newPaletteData.length // Update numColors based on loaded palette
			injectedSetPalette(palette.value) // Update the global state when an external palette is loaded
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

		watch(numColors, (newVal, oldVal) => {
			if (newVal !== oldVal) {
				// Re-evaluate the palette based on the new number of colors
				generatePaletteFromBase()
			}
		})

		watch(
			palette,
			newPalette => {
				localStorage.setItem('palette', JSON.stringify(newPalette))
				injectedSetPalette(newPalette) // Ensure global state is updated on any palette change
			},
			{ deep: true, immediate: true }
		) // immediate to emit initial palette

		onMounted(() => {
			const savedPalette = localStorage.getItem('palette')
			if (savedPalette) {
				try {
					const parsedPalette = JSON.parse(savedPalette)
					if (
						Array.isArray(parsedPalette) &&
						parsedPalette.every(
							item =>
								typeof item === 'object' &&
								item !== null &&
								'hex' in item &&
								'locked' in item
						)
					) {
						palette.value = parsedPalette
						numColors.value = parsedPalette.length // Adjust numColors based on loaded palette length
						injectedSetPalette(palette.value) // Emit initial palette from localStorage
					} else {
						console.warn(
							'Invalid palette data in localStorage. Generating a new palette.'
						)
						generatePaletteFromBase() // Use base generation with default baseColor
					}
				} catch (e) {
					console.error('Error parsing saved palette from localStorage:', e)
					generatePaletteFromBase() // Fallback to generating a new palette
				}
			} else {
				generatePaletteFromBase() // Use base generation with default baseColor
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
			setPalette,
			generatedExportCode, // Expose computed property
			copyExportCode, // Expose copy function
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

.preview-content {
	padding: 25px;
	border-radius: 8px;
	min-height: 200px;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 15px;
	transition: background-color 0.3s ease;
	box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
}

.preview-content h4 {
	font-size: 1.8em;
	margin: 0;
}

.preview-content p {
	font-size: 1em;
	line-height: 1.6;
	margin: 0;
}

.preview-card {
	padding: 20px;
	border-radius: 8px;
	font-weight: bold;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

.preview-controls {
	margin-top: 20px;
	display: flex;
	gap: 10px;
	justify-content: center;
}

.preview-bg-button {
	color: #111;
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
