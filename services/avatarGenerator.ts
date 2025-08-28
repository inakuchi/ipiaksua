// Paletas de colores
const IPIAK_COLORS = [ // Rojos predominantes / Tierra
  '#B91C1C', // red-700
  '#DC2626', // red-600
  '#9A3B3B', // custom dark red
  '#EF4444', // red-500
  '#7F1D1D', // red-800
  '#C08261', // sienna-like
  '#D2691E', // chocolate
  '#A0522D', // sienna
  '#E2C799', // peru-like
  '#8B4513'  // saddle brown
];

const SUA_COLORS = [ // Negros / Grises / Modo Oscuro
  '#1C1C1C', '#2B2B2B', '#3A3A3A', '#4F4F4F', '#6B6B6B',
  '#8B4513', '#A0522D', '#CD853F', '#BC8F8F', '#C19A6B'
];

export type Theme = 'ipiak' | 'sua';

const THEMES: Record<Theme, string[]> = {
  ipiak: IPIAK_COLORS,
  sua: SUA_COLORS,
};

// Caché simple para hashes repetidos
const __hashCache = new Map<string, number>();

// Hash simple para generar números consistentes
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32-bit integer
  }
  return Math.abs(hash);
}

function cachedHash(str: string): number {
  const existing = __hashCache.get(str);
  if (existing !== undefined) return existing;
  const h = simpleHash(str);
  __hashCache.set(str, h);
  return h;
}

// Extraer múltiples valores del hash para una mayor complejidad
function extractValues(hash: number, colorPalette: string[]) {
  return {
    primaryColor: hash % colorPalette.length,
    secondaryColor: (hash >> 4) % colorPalette.length,
    accentColor: (hash >> 8) % colorPalette.length,
    backgroundColor: (hash >> 12) % colorPalette.length,
    
    // Configuraciones de capas (RANGO AUMENTADO)
    layerCount: (hash >> 16) % 20 + 30, // base: 30-49 capas
  };
}

// --- Funciones de ayuda ---
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

// --- Generadores de Elementos ---
function generateAnimationStyles(): string {
    const keyframes = `
    @keyframes pulse { 
      0%, 100% { transform: scale(1); } 
      50% { transform: scale(1.02); } 
    }
    @keyframes rotate-cw {
      from { transform: rotate(0deg); } to { transform: rotate(360deg); }
    }
    @keyframes rotate-ccw {
      from { transform: rotate(0deg); } to { transform: rotate(-360deg); }
    }
  `;

    // Staggered animation delays for a more organic, flowing effect
    const styles = `
    /* Nuevo: respiración uniforme para todo el conjunto */
    .anim-breath { animation: pulse 6s ease-in-out infinite; }
    /* Clases legacy (no usadas para pulso ahora, se mantienen por compatibilidad de CSS) */
    .anim-center { }
    .anim-triangles { }
    .anim-dots { }
    .anim-rings { }
    .anim-rotate-cw { animation: rotate-cw 30s linear infinite; }
    .anim-rotate-ccw { animation: rotate-ccw 35s linear infinite; }
  `;
    
    return `<style>
    ${keyframes}
    /* Asegura que todas las transformaciones tomen como referencia el centro del viewBox */
    [class^="anim-"] { transform-box: view-box; transform-origin: 50% 50%; }
    ${styles}
  </style>`;
}

// Genera un círculo base
function generateBaseCircle(center: number, radius: number, color: string, strokeWidth: number, opacity: number): string {
    return `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" vector-effect="non-scaling-stroke"/>`;
}

// Genera puntos en la superficie de un círculo
function generateDotsOnCircle(center: number, radius: number, color: string, dotSize: number, dotCount: number, opacity: number, hash: number, layerIndex: number): string {
    const dots = [];
    const angleOffset = (hash >> (layerIndex * 2)) % 360;
    for (let i = 0; i < dotCount; i++) {
        const angle = (i * 360) / dotCount + angleOffset;
        const point = polarToCartesian(center, center, radius, angle);
        dots.push(`<circle cx="${point.x}" cy="${point.y}" r="${dotSize}" fill="${color}" opacity="${opacity}"/>`);
    }
    return dots.join('\n    ');
}

// Genera triángulos apuntando hacia afuera
function generateOutwardTriangles(center: number, radius: number, color: string, triangleCount: number, triangleHeight: number, opacity: number, hash: number, layerIndex: number): string {
    const triangles = [];
    const angleOffset = (hash >> (layerIndex * 3)) % 360;
    // Paso angular entre triángulos
    const step = 360 / triangleCount;
    const halfStep = step / 2;
    // Pequeño margen para evitar cualquier solape de bases entre triángulos adyacentes
    const epsilon = Math.max(0.2, step * 0.01);

    for (let i = 0; i < triangleCount; i++) {
        const angle = (i * 360 / triangleCount) + angleOffset;
        // Colocar las bases exactamente en los límites del sector (±halfStep) menos epsilon
        const p1 = polarToCartesian(center, center, radius, angle - (halfStep - epsilon));
        const p2 = polarToCartesian(center, center, radius, angle + (halfStep - epsilon));
        const p3 = polarToCartesian(center, center, radius + triangleHeight, angle);

        triangles.push(`<polygon points="${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}" fill="${color}" opacity="${opacity}"/>`);
    }
    return triangles.join('\n    ');
}

// Genera un anillo de arcos (círculo discontinuo)
function generateArcsOnCircle(center: number, radius: number, color: string, strokeWidth: number, arcCount: number, opacity: number, hash: number, layerIndex: number): string {
    const arcs = [];
    const angleOffset = (hash >> (layerIndex * 2)) % 360;
    const totalAngle = 360;
    const gapAngle = totalAngle / arcCount / 3; 
    const arcAngle = totalAngle / arcCount - gapAngle;

    for (let i = 0; i < arcCount; i++) {
        const startAngle = angleOffset + i * (arcAngle + gapAngle);
        const endAngle = startAngle + arcAngle;

        const start = polarToCartesian(center, center, radius, endAngle);
        const end = polarToCartesian(center, center, radius, startAngle);

        const largeArcFlag = arcAngle <= 180 ? "0" : "1";

        const d = [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");

        arcs.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`);
    }
    return arcs.join('\n    ');
}

// Genera un anillo ondulado
function generateWavyRing(center: number, radius: number, color: string, strokeWidth: number, waveCount: number, amplitude: number, opacity: number): string {
    const points = [];
    const segments = 180; // Puntos suficientes para una curva suave
    for (let i = 0; i <= segments; i++) {
        const angleDegrees = (i / segments) * 360;
        const angleRadians = angleDegrees * Math.PI / 180;
        const currentRadius = radius + Math.cos(angleRadians * waveCount) * amplitude;
        const point = polarToCartesian(center, center, currentRadius, angleDegrees);
        points.push(`${point.x},${point.y}`);
    }
    return `<polygon points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" vector-effect="non-scaling-stroke"/>`;
}

// [NUEVO] Genera un anillo con trazos discontinuos
function generateDashedRing(center: number, radius: number, color: string, strokeWidth: number, opacity: number, hash: number): string {
    const dashLength = 5 + (hash % 15); // Longitud del trazo entre 5 y 20
    const gapLength = 5 + ((hash >> 4) % 15); // Longitud del espacio entre 5 y 20
    return `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-dasharray="${dashLength} ${gapLength}" vector-effect="non-scaling-stroke"/>`;
}

// [NUEVO] Genera un anillo de triángulos isósceles idénticos entre dos radios (ri, ro)
function generateIsoscelesSawRing(
    center: number,
    ri: number,
    ro: number,
    color: string,
    strokeWidth: number,
    opacity: number,
    hash: number,
    size: number,
    margin: number = 0
): string {
    // Aplicar márgenes para no tocar bordes
    const inner = Math.max(0, ri + margin);
    const outer = Math.max(inner + 0.5, ro - margin);
    const height = Math.max(outer - inner, 0.5);

    // Densidad basada en circunferencia y base objetivo
    const rm = (inner + outer) / 2;
    const circumference = 2 * Math.PI * Math.max(inner, 1);
    const baseTarget = Math.max(6, size * 0.06); // base de cada triángulo en el círculo interior
    // Calcular semiancho angular α (en radianes) desde la base deseada en ri
    const ratio = Math.min(1, baseTarget / (2 * Math.max(inner, 1)));
    const alpha = Math.max(0.01, Math.asin(ratio));
    let n = Math.floor(Math.PI / alpha); // número de dientes alrededor
    // Clamps razonables según circunferencia
    const nMax = 480;
    const nMin = 12;
    if (!Number.isFinite(n) || n < nMin) n = nMin;
    if (n > nMax) n = nMax;

    // Offset angular desde hash
    const angleOffsetDeg = (hash >> 6) % 360;
    const angleOffset = angleOffsetDeg * Math.PI / 180;

    // Construir un path cerrado: M B1 L A L B2 ... Z
    const points: { x: number; y: number }[] = [];
    for (let k = 0; k < n; k++) {
        const theta = angleOffset + k * (2 * Math.PI / n);
        const b1 = polarToCartesian(center, center, inner, (theta - alpha) * 180 / Math.PI);
        const apex = polarToCartesian(center, center, outer, theta * 180 / Math.PI);
        const b2 = polarToCartesian(center, center, inner, (theta + alpha) * 180 / Math.PI);
        if (k === 0) points.push(b1);
        points.push(apex, b2);
    }

    // Cerrar volviendo al primer punto B1 de k=0
    const d: string[] = [];
    if (points.length) {
        d.push(`M ${points[0].x} ${points[0].y}`);
        for (let i = 1; i < points.length; i++) {
            d.push(`L ${points[i].x} ${points[i].y}`);
        }
        d.push('Z');
    }

    return `<path d="${d.join(' ')}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
}

// [NUEVO] Genera un anillo en zigzag
function generateZigzagRing(center: number, radius: number, color: string, strokeWidth: number, opacity: number, hash: number, pointCount: number, height: number): string {
    const points = [];
    const angleStep = 360 / pointCount;
    const angleOffset = (hash >> 8) % 360;

    for (let i = 0; i <= pointCount; i++) {
        const angle = angleOffset + i * angleStep;
        // Alternar entre el radio interior y el exterior
        const currentRadius = (i % 2 === 0) ? radius : radius + height;
        const point = polarToCartesian(center, center, currentRadius, angle);
        points.push(`${point.x},${point.y}`);
    }
    
    return `<polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
}

// --- Función Principal de Generación ---
function generateDeterministicAvatar(userId: string, options: { size?: number, animated?: boolean, theme?: Theme } = {}): string {
  const { size = 200, animated = false, theme = 'ipiak' } = options;
  if (!userId) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="transparent" /></svg>`;
  }
  
  const colorPalette = THEMES[theme];
  const hash = cachedHash(userId + theme); // Include theme in hash for different structures
  const values = extractValues(hash, colorPalette);
  
  const center = size / 2;
  const elements: string[] = [];
  const rotatingElements: string[] = []; // [NUEVO] Grupo para anillos que rotan
  
  // Base más tierra y oscura, diferenciada por tema
  // ipiak: chocolate profundo con matiz rojo; sua: gris casi negro
  const backgroundColor = theme === 'ipiak' ? '#1A0E09' : '#0F0F0F';

  // Fondo
  elements.push(`<rect width="${size}" height="${size}" fill="${backgroundColor}" opacity="0"/>`);
  
  const animationStyles = generateAnimationStyles();
  const isActuallyAnimated = animated;

  const animationGroups: { [key: string]: string[] } = {
    rings: [],
    dots: [],
    center: [],
    triangles: [],
  };

  const startRadius = size * 0.05;
  const maxRadius = size * 0.49;
  const totalRadiusRange = maxRadius - startRadius;

  // Ajuste dinámico de densidad por tamaño
  const baseLayerCount = values.layerCount;
  const sizeAdjusted = (() => {
    if (size <= 160) return Math.max(16, Math.floor(baseLayerCount * 0.6));
    if (size <= 240) return Math.max(18, Math.floor(baseLayerCount * 0.8));
    if (size <= 360) return Math.max(20, Math.floor(baseLayerCount * 0.9));
    return baseLayerCount; // tamaños grandes conservan densidad completa
  })();
  // Aumentar complejidad y variabilidad: más capas en general
  const densityMultiplier = (size >= 280 || !isActuallyAnimated) ? 2.8 : 2.0;
  const targetLayerCount = Math.floor(sizeAdjusted * densityMultiplier) + 12;

  // Control de superposición: seguir el "top" (borde exterior) del último anillo renderizado
  let lastTop = -Infinity;

  for (let i = 0; i < targetLayerCount; i++) {
    const layerHash = cachedHash(userId + i + theme);
    
    const progress = i / (targetLayerCount - 1);
    const easedProgress = Math.pow(progress, 2); 
    const radius = startRadius + totalRadiusRange * easedProgress;

    const nextProgress = (i + 1) / (targetLayerCount - 1);
    const nextEasedProgress = Math.pow(nextProgress, 2);
    const nextRadius = startRadius + totalRadiusRange * nextEasedProgress;
    const layerWidth = i === targetLayerCount - 1 ? (nextRadius - radius) : (size * 0.02);
    
    // Peso sesgado: aumentar probabilidad de anillos ondulados (6)
    // Mantiene determinismo al usar el mismo hash índice.
    const possibleLayerTypes = [0, 2, 3, 4, 5, 6, 6, 6, 7]; // 6 con triple peso
    let layerType = possibleLayerTypes[layerHash % possibleLayerTypes.length];
    // Forzar anillos ondulados con un poco más de frecuencia para garantizar presencia
    const forceWavy = (i % 4 === 2) || (layerHash % 9 === 0);
    if (forceWavy) layerType = 6;
    
    const colorIndex = (values.primaryColor + i) % colorPalette.length;
    const color = colorPalette[colorIndex];
    // Perfil determinista de grosor: rango fijo y refuerzo en el borde
    const minStroke = Math.max(0.35, size * 0.002);
    const outerMaxStroke = size * 0.0065; // moderadamente agresivo
    const easedStrokeProgress = Math.pow(easedProgress, 0.85);
    let strokeBase = minStroke + (outerMaxStroke - minStroke) * easedStrokeProgress;
    const isEdge = (i >= targetLayerCount - 2) || (progress > 0.92);
    const edgeBoostFactor = 1.2;
    const strokeWidth = isEdge ? strokeBase * edgeBoostFactor : strokeBase;
    const opacity = 1; 

    const circumference = 2 * Math.PI * radius;
    const safeMax = 480;
    const spacingBase = Math.max(3, size * 0.02);

    // Estimar extensión radial efectiva por tipo (dependiente del radio para mayor variabilidad)
    const triangleHeightForExtent = Math.max(2, layerWidth * 0.8);
    // Ondas: reducir altura general a la mitad (nuevo máximo) y tomar un valor aleatorio determinista hacia abajo
    const amplitudePrevMax = Math.max(1.5, layerWidth * (0.6 + 0.6 * easedProgress));
    const amplitudeMax = amplitudePrevMax * 0.5; // la mitad como altura máxima
    const rnd01 = (((layerHash >> 7) & 1023) / 1023); // determinista 0..1
    const amplitudeFactor = 0.4 + rnd01 * 0.6; // rango [0.4, 1.0]
    const amplitudeForWaves = Math.max(0.5, amplitudeMax * amplitudeFactor);
    // Puntos crecen hacia el borde
    const radialDotScale = 0.9 + 0.8 * easedProgress;
    const dotSizeAloneForExtent = Math.max(0.4, size * 0.0025 * radialDotScale);
    const dotSizeAttachedForExtent = Math.max(0.45, size * 0.0035 * radialDotScale);

    let extent = strokeWidth / 2; // por defecto
    switch (layerType) {
      case 2: // puntos solos
        extent = dotSizeAloneForExtent; break;
      case 3: // anillo + puntos
        extent = Math.max(strokeWidth / 2, dotSizeAttachedForExtent); break;
      case 4: // triángulos hacia afuera
        // Considerar el anillo de tope: añade la mitad del stroke de la base (mismo valor) al tope exterior
        const triStrokeForExtent = Math.max(0.25, strokeWidth * 0.8);
        extent = triangleHeightForExtent + triStrokeForExtent / 2; break;
      case 6: // ondulado
        extent = amplitudeForWaves + strokeWidth / 2; break;
      case 0: case 5: case 7:
      default:
        extent = strokeWidth / 2; break;
    }

    // separacion mínima respecto al top previo; considerar extensión hacia adentro
    // Gap muy pequeño para 99% de proximidad sin tocar: fija ~0.3px mínimo o 0.15x del stroke
    const minRadialGap = Math.max(0.3, strokeWidth * 0.15);
    // Para triángulos usaremos un stroke base reducido y lo tomaremos como tope máximo del layer
    const triBaseStrokeForGap = (layerType === 4) ? Math.max(0.25, strokeWidth * 0.8) : strokeWidth;
    // Si hay triángulos, se dibuja un anillo continuo como base, por lo que hay extensión hacia adentro = triBaseStroke/2
    const inwardExtent = (layerType === 4) ? Math.max(triBaseStrokeForGap / 2, 0) : extent;
    // Regla de relleno: si el espacio radial es grande, insertar un anillo de puntos micro en el medio
    const availableGap = (radius - inwardExtent) - lastTop;
    const largeGapThreshold = Math.max(size * 0.01, Math.max(layerWidth * 0.9, triangleHeightForExtent));
    if (availableGap > largeGapThreshold) {
      const fillerRadius = lastTop + availableGap * 0.5;
      const microDotSize = Math.max(0.15, size * 0.0008);
      const microCircumference = 2 * Math.PI * Math.max(fillerRadius, 1);
      const microCount = Math.min(Math.max(24, Math.floor(microCircumference / (spacingBase * 2.2))), safeMax);
      const microColorIndex = (values.secondaryColor + i) % colorPalette.length;
      const microColor = colorPalette[microColorIndex];
      animationGroups.dots.push(generateDotsOnCircle(center, fillerRadius, microColor, microDotSize, microCount, 0.6, hash, i));
      // No actualizamos lastTop: el relleno se ubica dentro del gap y no debe influir en el espaciado de capas principales
    }
    if ((radius - inwardExtent) - lastTop < minRadialGap) {
      continue;
    }
    // Guardar margen para no sobrepasar el radio exterior permitido
    const outerMargin = Math.max(0.5, strokeWidth / 2);
    if (radius + extent > maxRadius - outerMargin) {
      continue;
    }

    // [NUEVO] Lógica para decidir si un anillo rota
    const shouldRotate = isActuallyAnimated && (layerType === 0 || layerType === 5 || layerType === 6 || layerType === 7) && (layerHash % 5 === 0); // Rota 1 de cada 5 anillos aprox.

    let elementSVG = '';
    let added = false;
    switch(layerType) {
        case 0: // Círculo simple
            elementSVG = generateBaseCircle(center, radius, color, strokeWidth, opacity);
            added = true;
            break;
        case 2: // Puntos solos (más grandes hacia el borde)
            const dotCountAlone = Math.min(Math.max(12, Math.floor(circumference / (spacingBase * 0.95))), safeMax);
            const dotSizeAlone = Math.max(0.4, size * 0.0025 * radialDotScale);
            animationGroups.dots.push(generateDotsOnCircle(center, radius, color, dotSizeAlone, dotCountAlone, opacity, hash, i));
            added = true;
            break;
        case 3: // Círculo con puntos en su superficie
            animationGroups.rings.push(generateBaseCircle(center, radius, color, strokeWidth, opacity));
            const dotCountAttached = Math.min(Math.max(10, Math.floor(circumference / (spacingBase * 1.1))), safeMax);
            const dotSizeAttached = Math.max(0.45, size * 0.0035 * radialDotScale);
            animationGroups.dots.push(generateDotsOnCircle(center, radius, color, dotSizeAttached, dotCountAttached, opacity, hash, i));
            added = true;
            break;
        case 4: // Triángulos Shuar con base continua obligatoria y anillo de tope
            // Definir stroke del layer (ligeramente reducido) y usarlo como tope máximo
            const triBaseStroke = Math.max(0.25, strokeWidth * 0.8);
            // Dibujar SIEMPRE un anillo continuo como base en el mismo radio
            animationGroups.rings.push(generateBaseCircle(center, radius, color, triBaseStroke, opacity));
            const triFactor = 2.6 + (((layerHash % 5) - 2) * 0.3); // ~[1.7..3.5]
            const triangleCount = Math.min(Math.max(6, Math.floor(circumference / (spacingBase * triFactor))), safeMax);
            const triangleHeight = Math.max(2, layerWidth * 0.75); // un poco más achatado
            animationGroups.triangles.push(generateOutwardTriangles(center, radius, color, triangleCount, triangleHeight, opacity, hash, i));
            // Anillo de tope en las puntas (radio exterior de los triángulos) para crear el entramado
            animationGroups.rings.push(generateBaseCircle(center, radius + triangleHeight, color, triBaseStroke, opacity));
            added = true;
            break;
        case 5: // Arcos / Círculo discontinuo
            const arcCount = Math.min(Math.max(12, Math.floor(circumference / (spacingBase * 3))), safeMax);
            elementSVG = generateArcsOnCircle(center, radius, color, strokeWidth, arcCount, opacity, hash, i);
            added = true;
            break;
        case 6: // Anillo Ondulado
            const waveCount = 12 + (layerHash % 24) + Math.floor(easedProgress * 6);
            const amplitude = amplitudeForWaves;
            elementSVG = generateWavyRing(center, radius, color, strokeWidth, waveCount, amplitude, opacity);
            added = true;
            break;
        case 7: // Anillo Discontinuo
            elementSVG = generateDashedRing(center, radius, color, strokeWidth, opacity, layerHash);
            added = true;
            break;
    }

    if (elementSVG) {
        if (shouldRotate) {
          const rotationClass = (layerHash % 2 === 0) ? 'anim-rotate-cw' : 'anim-rotate-ccw';
          rotatingElements.push(`<g class="${rotationClass}">${elementSVG}</g>`);
        } else {
          animationGroups.rings.push(elementSVG);
        }
    }
    // Actualizar el último borde exterior colocado para respetar la separación mínima
    if (added) {
      lastTop = radius + extent;
    }
  }

  // Elemento central
  const centralElementSize = size * 0.03;
  animationGroups.center.push(`<circle cx="${center}" cy="${center}" r="${centralElementSize}" fill="${colorPalette[values.primaryColor]}" opacity="1"/>`);

  const clipId = `clip-${hash % 1000000000}`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${isActuallyAnimated ? animationStyles : ''}
  <defs>
    <clipPath id="${clipId}">
      <circle cx="${center}" cy="${center}" r="${maxRadius}"/>
    </clipPath>
  </defs>
  ${elements.join('\n  ')}
  <g clip-path="url(#${clipId})" class="${isActuallyAnimated ? 'anim-breath' : ''}">
    ${rotatingElements.join('\n    ')}
    <g>${animationGroups.center.join('\n      ')}</g>
    <g>${animationGroups.triangles.join('\n      ')}</g>
    <g>${animationGroups.dots.join('\n      ')}</g>
    <g>${animationGroups.rings.join('\n      ')}</g>
  </g>
</svg>`;
}

function generateAvatarDataUrl(userId: string, size: number = 200, animated: boolean = false, theme: Theme = 'ipiak'): string {
  const svg = generateDeterministicAvatar(userId, { size, animated, theme });
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}

export { generateDeterministicAvatar, generateAvatarDataUrl };

