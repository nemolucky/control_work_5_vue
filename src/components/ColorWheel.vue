<template>
	<div class="color-wheel-container">
		<h4>Цветовой круг</h4>
		<canvas ref="canvas" width="200" height="200"></canvas>
	</div>
</template>

<script>
import { onMounted, ref, watch } from 'vue'

export default {
	name: 'ColorWheel',
	props: {
		palette: {
			type: Array,
			required: true,
		},
	},
	setup(props) {
		const canvas = ref(null)

		const drawColorWheel = () => {
			const ctx = canvas.value.getContext('2d')
			const centerX = canvas.value.width / 2
			const centerY = canvas.value.height / 2
			const radius = 90

			for (let i = 0; i < 360; i++) {
				const angle = (i * Math.PI) / 180
				ctx.beginPath()
				ctx.moveTo(centerX, centerY)
				ctx.arc(centerX, centerY, radius, angle, angle + Math.PI / 180)
				ctx.closePath()
				ctx.fillStyle = `hsl(${i}, 100%, 50%)`
				ctx.fill()
			}
		}

		const drawPalettePoints = () => {
			const ctx = canvas.value.getContext('2d')
			const centerX = canvas.value.width / 2
			const centerY = canvas.value.height / 2
			const radius = 90

			props.palette.forEach(color => {
				const hsl = color.hsl
				if (!hsl) return

				const angle = (hsl.h * Math.PI) / 180
				const x = centerX + radius * Math.cos(angle) * hsl.s
				const y = centerY + radius * Math.sin(angle) * hsl.s

				ctx.beginPath()
				ctx.arc(x, y, 5, 0, 2 * Math.PI)
				ctx.fillStyle = 'white'
				ctx.fill()
				ctx.strokeStyle = 'black'
				ctx.lineWidth = 2
				ctx.stroke()
			})
		}

		onMounted(() => {
			drawColorWheel()
			drawPalettePoints()
		})

		watch(
			() => props.palette,
			() => {
				const ctx = canvas.value.getContext('2d')
				ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
				drawColorWheel()
				drawPalettePoints()
			},
			{ deep: true }
		)

		return {
			canvas,
		}
	},
}
</script>

<style scoped>
.color-wheel-container {
	margin-top: 40px;
	padding: 25px;
	border: 1px solid #e0e0e0;
	border-radius: 12px;
	background-color: #fdfdfd;
	box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
	text-align: center;
}
</style>
