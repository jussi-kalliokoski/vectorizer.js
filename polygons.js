function createPalette (imagedata) {
	var w = imagedata.width
	var h = imagedata.height
	var d = new Uint32Array(imagedata.data)
	var c = new Uint8Array(imagedata.data)
	var p = []

	for (var i=0, n=3; i<d.length; i++, n+=4) {
		if (!c[n]) continue
		if (~p.indexOf(d[i])) continue

		p.push(d[i])
	}

	return new Uint32Array(p)
}

function createVectors (v, imagedata, color) {
	var w = imagedata.width
	var h = imagedata.height
	var d = new Uint32Array(imagedata.data)

	for (var i=0; i<d.length; i++) {
		if (d[i] !== color) continue

		addSquareVector(v, i % w, ~~(i / w))
	}
}

function addSquareVector (vectors, j, k) {
	var n = vectors.length

	var v1 = {
		sx: j,
		sy: k,
		ex: j + 1,
		ey: k,
		status: 0
	}

	var v2 = {
		sx: j + 1,
		sy: k,
		ex: j + 1,
		ey: k + 1,
		status: 0
	}

	var v3 = {
		sx: j + 1,
		sy: k + 1,
		ex: j,
		ey: k + 1,
		status: 0
	}

	var v4 = {
		sx: j,
		sy: k + 1,
		ex: j,
		ey: k,
		status: 0
	}

	v1.prev = v4
	v1.next = v2
	v2.prev = v1
	v2.next = v3
	v3.prev = v2
	v3.next = v4
	v4.prev = v3
	v4.next = v1

	vectors.push(v1, v2, v3, v4)
}

function simplifyVectors (v) {
	for (var i=1; i<v.length; i++) {
		for (var n=i+1; n<v.length; n++) {
			if (!equalVectors(v, i, n)) continue

			removeVectors(v, i, n)
		}
	}
}

function equalVectors (v, i, n) {
	var msx, msy, mex, mey, m2sx, m2sy, m2ex, m2ey
	var r = false

	if (v[i].status === -1) return r

	msx = v[i].sx
	msy = v[i].sy
	mex = v[i].ex
	mey = v[i].ey

	m2sx = v[n].sx
	m2sy = v[n].sy
	m2ex = v[n].ex
	m2ey = v[n].ey

	if (
		equalPoints(msx, msy, m2sx, m2sy) &&
		equalPoints(mex, mey, m2ex, m2ey)
	) r = true

	if (
		equalPoints(msx, msy, m2ex, m2ey) &&
		equalPoints(mex, mey, m2sx, m2sy)
	) r = true

	return r
}

function equalPoints (p1x, p1y, p2x, p2y) {
	return p1x === p2x && p1y === p2y
}

function removeVectors (v, i, n) {
	removeVector(v, i, n)
	removeVector(v, n, i)

	v[i].status = -1
	v[n].status = -1
}

function removeVector (v, i, n) {
	var p, m

	p = v[i].prev
	p.next = v[n].next

	m = v[n].next
	m.prev = p
}

function lengthenVectors (v) {
	for (var i=0; i<v.length; i++) {
		if (!v[i].prev || v[i].status === -1) {
			v.splice(i--, 1)

			continue
		}

		if (
			v[i].prev.sx !== v[i].ex &&
			v[i].prev.sy !== v[i].ey
		) continue

		v[i].prev.ex = v[i].ex
		v[i].prev.ey = v[i].ey
		v[i].prev.next = v[i].next
		v[i].next.prev = v[i].prev

		v[i].status = -1

		v.splice(i--, 1)
	}
}

function createPolygons (polygons, v, c) {
	while (v.length) {
		var vec = v.shift()

		if (vec.status === -1) continue

		var polygon = [vec.sx, vec.sy]
		var first = vec

		vec = vec.next

		while (vec && vec !== first) {
			polygon.push(vec.sx, vec.sy)

			vec.status = -1
			vec = vec.next
		}

		if (polygon.length <= 1) continue

		polygon = {
			path: polygon,
			color: c
		}

		polygons.push(polygon)
	}
}

function offsetVectors (v, left, top) {
	left = left || 0
	top = top || 0

	for (var i=0; i<v.length; i++) {
		v[i].sx += left
		v[i].sy += top
		v[i].ex += left
		v[i].ey += top
	}
}

this.onmessage = function (e) {
	var p = createPalette(e.data)
	var v = []
	var polygons = []

	for (var i=0; i<p.length; i++) {
		v[i] = []

		createVectors(v[i], e.data, p[i])
		simplifyVectors(v[i])
		lengthenVectors(v[i])
		offsetVectors(v[i], e.data.left, e.data.top)
		createPolygons(polygons, v[i], p[i])
	}

	this.postMessage(polygons)
}
