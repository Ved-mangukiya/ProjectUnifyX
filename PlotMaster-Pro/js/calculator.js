class PlotCalculator {
    // Shoelace formula for accurate area calculation
    calculateAreaShoelace(coords) {
        let area = 0;
        const n = coords.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += coords[i].x * coords[j].y;
            area -= coords[j].x * coords[i].y;
        }
        return Math.abs(area / 2);
    }

    // Generate regular polygon with proper proportional scaling
    generateRegularPolygon(sideLength, numSides) {
        const coords = [];
        const radius = sideLength / (2 * Math.sin(Math.PI / numSides));
        for (let i = 0; i < numSides; i++) {
            const angle = 2 * Math.PI * i / numSides - Math.PI/2;
            coords.push({
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle)
            });
        }
        return coords;
    }

    generateRectangle(length, width) {
        return [
            {x: 0, y: 0}, {x: length, y: 0},
            {x: length, y: width}, {x: 0, y: width}
        ];
    }

    generateCircle(radius, numSides = 36) {
        const coords = [];
        for (let i = 0; i < numSides; i++) {
            const angle = 2 * Math.PI * i / numSides;
            coords.push({
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle)
            });
        }
        return coords;
    }

    calculatePerimeter(sides) {
        return sides.reduce((a, b) => a + b, 0);
    }

    calculateCentroid(coords) {
        let x = 0, y = 0;
        coords.forEach(p => {x += p.x; y += p.y;});
        return {x: x / coords.length, y: y / coords.length};
    }

    calculateBounds(coords) {
        return {
            minX: Math.min(...coords.map(p => p.x)),
            maxX: Math.max(...coords.map(p => p.x)),
            minY: Math.min(...coords.map(p => p.y)),
            maxY: Math.max(...coords.map(p => p.y))
        };
    }

    checkTriangleInequality(sides) {
        if(sides.some(s => s <= 0)) return false;
        const total = sides.reduce((a,b) => a+b, 0);
        const maxSide = Math.max(...sides);
        return maxSide < (total - maxSide);
    }

    getAreaConversions(area, unit) {
        const factors = {
            'sq meters': 1, 'sq feet': 10.7639,
            'sq yards': 1.19599, 'acres': 0.000247,
            'hectares': 0.0001
        };
        const conversions = {};
        for(let key in factors) {
            conversions[key] = area * factors[key];
        }
        return conversions;
    }

    generateIrregularPolygon(sides) {
        const coords = [];
        let angle = 0;
        const n = sides.length;
        coords.push({x: 0, y: 0});
        for(let i = 0; i < n-1; i++) {
            angle += (2*Math.PI)/n;
            coords.push({
                x: coords[coords.length-1].x + sides[i]*Math.cos(angle),
                y: coords[coords.length-1].y + sides[i]*Math.sin(angle)
            });
        }
        return coords;
    }
}
