export function hexToRgba(hex: string, alpha: number) {
	// Remove the hash at the start if it's there
	hex = hex.replace(/^#/, "");
	// Parse the r, g, b values
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);
	// Return the RGBA string
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
