function createSVG (width, height) {
	var svg = document.createElement('svg')

	svg.setAttribute('xmlns', "http://www.w3.org/2000/svg")
	svg.setAttribute('version', "1.1")
	svg.setAttribute('viewBox', "0 0 " + width + " " + height)
	svg.setAttribute('width', width + 'px')
	svg.setAttribute('height', height + 'px')

	svg.style.width = width + 'px'
	svg.style.height = height + 'px'


	return svg
}

function SVGAddPath (svg, path, color) {
	var p = document.createElement('path')

	p.setAttribute('d', 'M ' + path[0] + ' ' + path[1] + ' L ' +
		[].slice.call(path, 2).join(' ') + ' z')
	p.setAttribute('fill', color)

	svg.appendChild(p)
}
