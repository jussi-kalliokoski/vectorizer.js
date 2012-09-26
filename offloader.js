function reportProgress (operation, amount) {
	this.postMessage({
		type: 'progress',
		op: operation,
		am: amount
	})
}

function splitImage (img, partCount) {
	reportProgress('split', 0.0)

	var partHeight = ~~(img.height / parts)
	var partSize = 4 * img.width * partHeight
	var data = new Uint8Array(img.data)
	var parts = []
	var part, i, o

	for (i=0, o=0; i<parts-1; i++, o+=partSize) {
		part = {
			top: i * partHeight,
			width: img.width,
			height: partHeight,
			data: new Uint8Array(partSize)
		}
		part.data.set(data.subarray(o, o + partSize))
		part.data = part.data.buffer

		parts.push({
			image: part,
			amount: part.data.byteLength / data.length
		})
	}

	part = {
		top: i * partHeight,
		width: img.width,
		height: img.height % partHeight,
		data: new Uint8Array(data.length - o)
	}
	part.data.set(data.subarray(o))
	part.data = part.data.buffer

	parts.push({
		image: part,
		amount: part.data.byteLength / data.length
	})

	reportProgress('split', 1.0)

	return parts
}

function hasPolygons (img) {
	return !!img.polygons
}

function getAmount (img) {
	return img.amount
}

function combinePolygons (a, b) {
	return a.concat(b)
}

function mapPolygons (p) {
	return p.polygons
}

function optimizePolygon (polygon) {
	polygon.path = new Float64Array(polygon.path).buffer
}

function polygonBuffer (polygon) {
	return polygon.path
}

function sum (a, b) {
	return a + b
}

function mergeParts (parts) {
	reportProgress('merge', 0.0)

	var polygons = parts.map(mapPolygons).reduce(combinePolygons)

	/* TODO: merge the polygons that seem to be the same polygon */

	polygons.forEach(optimizePolygon)

	reportProgress('merge', 1.0)

	this.postMessage({
		type: 'ready',
		polygons: polygons
	}, polygons.map(polygonBuffer))
}

function onHasPolygons (e) {
	var parts = this.context.parts

	this.polygons = e.data

	reportProgress('polygons', parts.map(getAmount).reduce(sum))

	if (parts.filter(hasPolygons).length !== parts.length) return

	mergeParts(parts)
}

function offload (img) {
	var worker = new Worker('polygons.js')

	img.context = this
	img.worker = worker

	worker.onmessage = onHasPolygons.bind(img)

	worker.postMessage(img.image, [img.image.data])
}

this.onmessage = function (e) {
	var workerCount = 4

	var context = {}

	context.parts = splitImage(e.data.image, workerCount)
	context.parts.forEach(offload.bind(context))

	reportProgress('polygons', 0.0)
}
