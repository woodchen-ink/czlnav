// 从 mark.svg (完整标志) 与 glyph.svg (小尺寸符号) 生成 CZL导航 全部图标资源 (规格见 czl-skill product-logo.md §7)。
// 两个 SVG 是从 czl-skill references/product-logo/{marks,glyphs}/czlnav.svg 拷贝来的单一来源, 不在本仓库改造型。
// 依赖 @resvg/resvg-js@2.6.2, 仓库不留 node_modules: 在任意临时目录 `npm i --no-save @resvg/resvg-js@2.6.2`,
// 再用 NODE_PATH 指过去运行; 之后跑 build-ico.py 打包 favicon 并给满幅图标去 alpha:
//   NODE_PATH=<临时目录>/node_modules node docs/design/brand/build-icons.js
//   python docs/design/brand/build-ico.py
// 仓库 package.json 为 type: module; 用 createRequire 加载依赖, 以便 NODE_PATH 生效
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const { Resvg } = createRequire(import.meta.url)('@resvg/resvg-js')

const BRAND = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(BRAND, '../../..')
const PUB = path.join(ROOT, 'frontend/public')
// build-ico.py 读取的中间文件
const TMP = path.join(os.tmpdir(), 'czlnav-brand')
fs.mkdirSync(TMP, { recursive: true })

// 读单 path 的源 SVG: viewBox 与 path d
const load = (file) => {
  const src = fs.readFileSync(path.join(BRAND, file), 'utf8')
  const [x, y, w, h] = src.match(/viewBox="([^"]+)"/)[1].trim().split(/\s+/).map(Number)
  const d = src.match(/<path[^>]*\sd="([^"]+)"/)[1]
  return { x, y, w, h, d }
}
const mark = load('mark.svg')
const glyph = load('glyph.svg')

const C1 = '#2EA7E0'
const C2 = '#246CC8'
const f = (n) => +n.toFixed(3)
const gradDef = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C1}"/><stop offset="1" stop-color="${C2}"/></linearGradient></defs>`

// 图形放进 size 方形画布: 长边占 ratio, 居中; fill 为 'gradient' 或颜色; bg 为满幅底色 (省略即透明)
const place = (shape, size, ratio, fill, bg) => {
  const s = (size * ratio) / Math.max(shape.w, shape.h)
  const tx = (size - shape.w * s) / 2 - shape.x * s
  const ty = (size - shape.h * s) / 2 - shape.y * s
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    (fill === 'gradient' ? gradDef : '') +
    (bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : '') +
    `<path fill="${fill === 'gradient' ? 'url(#g)' : fill}" transform="translate(${f(tx)} ${f(ty)}) scale(${f(s)})" d="${shape.d}"/></svg>\n`
  )
}

// 透明底完整标志, 紧贴包围盒 (页头 Logo)
const markSvg = (gradient) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${mark.x} ${mark.y} ${mark.w} ${mark.h}" width="${mark.w}" height="${mark.h}">` +
  (gradient ? gradDef : '') +
  `<path fill="${gradient ? 'url(#g)' : '#fff'}" d="${mark.d}"/></svg>\n`

// 小尺寸符号撑满画布, 每边留 pad 像素抗锯齿余量
const glyphSvg = (size, pad = 0.5) => place(glyph, size, (size - 2 * pad) / size, C1)

const png = (svg) => new Resvg(svg).render().asPng()
const write = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, data)
  console.log('wrote', path.relative(ROOT, file))
}

// 页头 Logo: 后台亮色用渐变, 公开端深色玻璃页头与后台暗色用白色
write(path.join(PUB, 'images/logo.svg'), markSvg(true))
write(path.join(PUB, 'images/logo-white.svg'), markSvg(false))

// icon.svg (layout metadata 引用, 浏览器标签): 小尺寸符号, 亮暗主题通用
write(path.join(PUB, 'icon.svg'), glyphSvg(256, 4))

// PWA any: 透明底完整标志
write(path.join(PUB, 'images/icon-192.png'), png(place(mark, 192, 0.92, 'gradient')))
write(path.join(PUB, 'images/icon-512.png'), png(place(mark, 512, 0.92, 'gradient')))

// 白色满幅底, build-ico.py 去 alpha
write(path.join(PUB, 'images/apple-touch-icon.png'), png(place(mark, 180, 0.7, 'gradient', '#fff')))
write(path.join(PUB, 'images/icon-maskable-512.png'), png(place(mark, 512, 0.6, 'gradient', '#fff')))

// favicon 源: 16 小尺寸符号, 32 / 48 透明底完整标志 (24px 起一律用完整标志)
write(path.join(TMP, 'ico-16.png'), png(glyphSvg(16)))
write(path.join(TMP, 'ico-32.png'), png(place(mark, 32, 0.92, 'gradient')))
write(path.join(TMP, 'ico-48.png'), png(place(mark, 48, 0.92, 'gradient')))
// 验收预览用 (不进仓库)
write(path.join(TMP, 'mark-24.png'), png(place(mark, 24, 0.92, 'gradient')))
write(path.join(TMP, 'mark-white-32.png'), png(place(mark, 32, 0.92, '#fff')))
