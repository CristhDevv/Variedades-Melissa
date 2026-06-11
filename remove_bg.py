from PIL import Image
import numpy as np

img = Image.open("Minimalist_logo_design_VM_202606021120.jpeg").convert("RGBA")
data = np.array(img)

r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

# Eliminar fondo blanco/gris claro (patrón de cuadros de transparencia)
mask = (r > 200) & (g > 200) & (b > 200) & (np.abs(r.astype(int) - g.astype(int)) < 20) & (np.abs(g.astype(int) - b.astype(int)) < 20)

data[:,:,3] = np.where(mask, 0, 255)

result = Image.fromarray(data)
result.save("public/logo.png", "PNG")
print("OK - Logo minimalist guardado como public/logo.png")
