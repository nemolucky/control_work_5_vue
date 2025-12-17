<template>
	<div class="palette-library">
		<h3>Библиотека сохраненных палитр</h3>
		<div class="save-current-palette">
			<input
				type="text"
				v-model="newPaletteName"
				placeholder="Название палитры"
				class="palette-name-input"
			/>
			<input
				type="text"
				v-model="newPaletteTags"
				placeholder="Тэги (через запятую)"
				class="palette-tags-input"
			/>
			<button
				@click="saveCurrentPalette"
				:disabled="!newPaletteName.trim()"
				class="save-button"
			>
				Сохранить текущую палитру
			</button>
		</div>

		<div class="library-controls">
			<input
				type="text"
				v-model="searchTerm"
				placeholder="Поиск по названию или тэгам"
				class="search-input"
			/>
			<select v-model="filterByFavorite" class="filter-select">
				<option :value="false">Все палитры</option>
				<option :value="true">Избранное</option>
			</select>
		</div>

		<div v-if="filteredPalettes.length > 0" class="saved-palettes-grid">
			<div
				v-for="paletteItem in filteredPalettes"
				:key="paletteItem.id"
				class="palette-item"
			>
				<div class="palette-header">
					<h4 class="palette-item-name">{{ paletteItem.name }}</h4>
					<button
						@click="toggleFavorite(paletteItem.id)"
						class="favorite-button"
					>
						{{ paletteItem.favorite ? '❤️' : '🤍' }}
					</button>
				</div>
				<div class="palette-colors">
					<div
						v-for="(color, index) in paletteItem.colors"
						:key="index"
						:style="{ backgroundColor: color.hex }"
						class="palette-color-swatch"
					></div>
				</div>
				<div class="palette-tags">
					<span
						v-for="tag in paletteItem.tags"
						:key="tag"
						class="palette-tag"
						>{{ tag }}</span
					>
				</div>
				<div class="palette-actions">
					<button
						@click="loadPalette(paletteItem.id)"
						class="action-button load-button"
					>
						Загрузить в генератор
					</button>
					<button
						@click="editPalette(paletteItem.id)"
						class="action-button edit-button"
					>
						Редактировать
					</button>
					<button
						@click="deletePalette(paletteItem.id)"
						class="action-button delete-button"
					>
						Удалить
					</button>
				</div>
			</div>
		</div>
		<p v-else class="no-palettes">Нет сохраненных палитр.</p>

		<!-- Edit Modal -->
		<div v-if="editingPalette" class="edit-modal-overlay">
			<div class="edit-modal">
				<h4>Редактировать палитру "{{ editingPalette.name }}"</h4>
				<label>
					Название:
					<input type="text" v-model="editingPalette.name" class="edit-input" />
				</label>
				<label>
					Тэги (через запятую):
					<input
						type="text"
						v-model="editingPalette.tagsInput"
						class="edit-input"
					/>
				</label>
				<div class="edit-modal-actions">
					<button @click="saveEditedPalette" class="action-button save-button">
						Сохранить
					</button>
					<button @click="cancelEdit" class="action-button cancel-button">
						Отмена
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router' // Import useRouter

export default {
	name: 'PaletteLibrary',
	setup() {
		const savedPalettes = ref([])
		const newPaletteName = ref('')
		const newPaletteTags = ref('')
		const searchTerm = ref('')
		const filterByFavorite = ref(false)

		const editingPalette = ref(null) // Stores the palette being edited

		const router = useRouter() // Access the router instance

		// Inject provided values
		const currentPalette = inject('currentPalette')
		const setPalette = inject('setPalette')

		// Load palettes from localStorage on mount
		onMounted(() => {
			const storedPalettes = localStorage.getItem('savedPalettes')
			if (storedPalettes) {
				savedPalettes.value = JSON.parse(storedPalettes)
			}
		})

		// Watch for changes in savedPalettes and store them
		watch(
			savedPalettes,
			newVal => {
				localStorage.setItem('savedPalettes', JSON.stringify(newVal))
			},
			{ deep: true }
		)

		const saveCurrentPalette = () => {
			if (!newPaletteName.value.trim()) return

			const tagsArray = newPaletteTags.value
				.split(',')
				.map(tag => tag.trim())
				.filter(tag => tag.length > 0)

			const newPalette = {
				id: Date.now(), // Simple unique ID
				name: newPaletteName.value.trim(),
				tags: tagsArray,
				colors: currentPalette.value, // Use injected currentPalette
				favorite: false,
			}
			savedPalettes.value.push(newPalette)
			newPaletteName.value = ''
			newPaletteTags.value = ''
		}

		const loadPalette = id => {
			const paletteToLoad = savedPalettes.value.find(p => p.id === id)
			if (paletteToLoad) {
				setPalette(paletteToLoad.colors) // Use injected setPalette
				router.push('/') // Navigate back to the generator
			}
		}

		const deletePalette = id => {
			savedPalettes.value = savedPalettes.value.filter(p => p.id !== id)
		}

		const toggleFavorite = id => {
			const paletteIndex = savedPalettes.value.findIndex(p => p.id === id)
			if (paletteIndex !== -1) {
				savedPalettes.value[paletteIndex].favorite =
					!savedPalettes.value[paletteIndex].favorite
			}
		}

		const editPalette = id => {
			const paletteToEdit = savedPalettes.value.find(p => p.id === id)
			if (paletteToEdit) {
				editingPalette.value = {
					...paletteToEdit,
					tagsInput: paletteToEdit.tags.join(', '),
				}
			}
		}

		const saveEditedPalette = () => {
			if (editingPalette.value) {
				const paletteIndex = savedPalettes.value.findIndex(
					p => p.id === editingPalette.value.id
				)
				if (paletteIndex !== -1) {
					savedPalettes.value[paletteIndex].name =
						editingPalette.value.name.trim()
					savedPalettes.value[paletteIndex].tags =
						editingPalette.value.tagsInput
							.split(',')
							.map(tag => tag.trim())
							.filter(tag => tag.length > 0)
					cancelEdit()
				}
			}
		}

		const cancelEdit = () => {
			editingPalette.value = null
		}

		const filteredPalettes = computed(() => {
			return savedPalettes.value.filter(paletteItem => {
				const matchesSearch =
					searchTerm.value.trim() === '' ||
					paletteItem.name
						.toLowerCase()
						.includes(searchTerm.value.toLowerCase()) ||
					paletteItem.tags.some(tag =>
						tag.toLowerCase().includes(searchTerm.value.toLowerCase())
					)
				const matchesFavorite = !filterByFavorite.value || paletteItem.favorite
				return matchesSearch && matchesFavorite
			})
		})

		return {
			savedPalettes,
			newPaletteName,
			newPaletteTags,
			searchTerm,
			filterByFavorite,
			editingPalette,
			saveCurrentPalette,
			loadPalette,
			deletePalette,
			toggleFavorite,
			editPalette,
			saveEditedPalette,
			cancelEdit,
			filteredPalettes,
		}
	},
}
</script>

<style scoped>
.palette-library {
	margin-top: 40px;
	padding: 25px;
	border: 1px solid #e0e0e0;
	border-radius: 12px;
	background-color: #fdfdfd;
	box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
}

.palette-library h3 {
	text-align: center;
	color: #555;
	margin-bottom: 25px;
}

.save-current-palette,
.library-controls {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-bottom: 20px;
	padding: 15px;
	background-color: #f8f9fa;
	border-radius: 8px;
	align-items: center;
}

.palette-name-input,
.palette-tags-input,
.search-input,
.filter-select {
	flex-grow: 1;
	padding: 10px 15px;
	border: 1px solid #ccc;
	border-radius: 6px;
	font-size: 1em;
	min-width: 150px;
}

.save-button {
	padding: 10px 20px;
	background-color: #28a745;
	color: white;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 1em;
	transition: background-color 0.2s ease;
}

.save-button:hover:not(:disabled) {
	background-color: #218838;
}

.save-button:disabled {
	background-color: #94d3a2;
	cursor: not-allowed;
}

.saved-palettes-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 20px;
}

.palette-item {
	border: 1px solid #eee;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.palette-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px 15px;
	background-color: #f0f0f0;
	border-bottom: 1px solid #eee;
}

.palette-item-name {
	margin: 0;
	font-size: 1.1em;
	color: #333;
}

.favorite-button {
	background: none;
	border: none;
	font-size: 1.5em;
	cursor: pointer;
	transition: transform 0.2s ease;
}

.favorite-button:hover {
	transform: scale(1.1);
}

.palette-colors {
	display: flex;
	min-height: 80px;
}

.palette-color-swatch {
	flex: 1;
	height: 100%;
}

.palette-tags {
	padding: 10px 15px;
	border-top: 1px solid #eee;
	display: flex;
	flex-wrap: wrap;
	gap: 5px;
}

.palette-tag {
	background-color: #e9ecef;
	padding: 5px 10px;
	border-radius: 4px;
	font-size: 0.8em;
	color: #555;
}

.palette-actions {
	display: flex;
	justify-content: space-around;
	padding: 10px;
	border-top: 1px solid #eee;
	background-color: #f8f9fa;
}

.action-button {
	padding: 8px 12px;
	border: none;
	border-radius: 5px;
	cursor: pointer;
	font-size: 0.9em;
	transition: background-color 0.2s ease;
}

.load-button {
	background-color: #007bff;
	color: white;
}

.load-button:hover {
	background-color: #0056b3;
}

.edit-button {
	background-color: #ffc107;
	color: #333;
}

.edit-button:hover {
	background-color: #e0a800;
}

.delete-button {
	background-color: #dc3545;
	color: white;
}

.delete-button:hover {
	background-color: #c82333;
}

.no-palettes {
	text-align: center;
	color: #666;
	margin-top: 20px;
	font-style: italic;
}

/* Edit Modal Styles */
.edit-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}

.edit-modal {
	background-color: white;
	padding: 30px;
	border-radius: 10px;
	box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
	width: 90%;
	max-width: 500px;
}

.edit-modal h4 {
	margin-top: 0;
	margin-bottom: 20px;
	text-align: center;
	color: #333;
}

.edit-modal label {
	display: block;
	margin-bottom: 15px;
	font-weight: 600;
	color: #555;
}

.edit-input {
	width: 100%;
	padding: 10px 15px;
	margin-top: 5px;
	border: 1px solid #ccc;
	border-radius: 6px;
	font-size: 1em;
}

.edit-modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 20px;
}

.cancel-button {
	background-color: #6c757d;
	color: white;
}

.cancel-button:hover {
	background-color: #5a6268;
}
</style>
