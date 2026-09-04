import { Fragment, type ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const BLOCKED_ELEMENTS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form', 'input', 'button'])

function safeLink(href: string | null) {
  if (!href) return null

  try {
    const parsed = new URL(href, window.location.origin)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.toString() : null
  } catch {
    return null
  }
}

function renderChildren(node: ChildNode, keyPrefix: string): ReactNode[] {
  return Array.from(node.childNodes).map((child, index) => renderHtmlNode(child, `${keyPrefix}-${index}`))
}

function renderHtmlNode(node: ChildNode, key: string): ReactNode {
  if (node.nodeType === 3) return node.textContent
  if (node.nodeType !== 1) return null

  const element = node as HTMLElement
  const tag = element.tagName.toLowerCase()
  if (BLOCKED_ELEMENTS.has(tag)) return null

  const children = renderChildren(element, key)

  switch (tag) {
    case 'p':
      return <p key={key}>{children}</p>
    case 'div':
      return <div key={key}>{children}</div>
    case 'br':
      return <br key={key} />
    case 'strong':
    case 'b':
      return <strong key={key} className='font-semibold text-foreground'>{children}</strong>
    case 'em':
    case 'i':
      return <em key={key}>{children}</em>
    case 'u':
      return <span key={key} className='underline underline-offset-4'>{children}</span>
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return <h3 key={key} className='pt-2 text-base font-semibold text-foreground'>{children}</h3>
    case 'ul':
      return <ul key={key} className='list-disc pl-5'>{children}</ul>
    case 'ol':
      return <ol key={key} className='list-decimal pl-5'>{children}</ol>
    case 'li':
      return <li key={key} className='pl-1'>{children}</li>
    case 'blockquote':
      return <blockquote key={key} className='border-l-2 border-border pl-4 text-muted-foreground'>{children}</blockquote>
    case 'code':
      return <code key={key} className='rounded-md bg-muted px-1.5 py-0.5 text-[0.9em]'>{children}</code>
    case 'pre':
      return <pre key={key} className='overflow-x-auto rounded-xl border bg-muted p-4 text-xs leading-6'><code>{element.textContent}</code></pre>
    case 'hr':
      return <Separator key={key} />
    case 'a': {
      const href = safeLink(element.getAttribute('href'))
      if (!href) return <Fragment key={key}>{children}</Fragment>
      return (
        <a key={key} href={href} target='_blank' rel='noopener noreferrer' className='font-medium text-primary underline underline-offset-4 hover:opacity-80'>
          {children}
        </a>
      )
    }
    default:
      return <Fragment key={key}>{children}</Fragment>
  }
}

function renderInlineText(text: string) {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    nodes.push(
      <a key={`${match[2]}-${match.index}`} href={match[2]} target='_blank' rel='noopener noreferrer' className='font-medium text-primary underline underline-offset-4 hover:opacity-80'>
        {match[1]}
      </a>,
    )
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes.length > 0 ? nodes : text
}

function renderPlainText(content: string) {
  return content.split(/\r?\n/).map((line, index) => (
    line.trim()
      ? <p key={`line-${index}`}>{renderInlineText(line)}</p>
      : <span key={`space-${index}`} aria-hidden='true' className='h-1' />
  ))
}

function looksLikeHtml(content: string) {
  return /<\/?[a-z][^>]*>/i.test(content)
}

export function noticeToPlainText(content: string) {
  if (!content.trim()) return ''

  if (typeof DOMParser !== 'undefined' && looksLikeHtml(content)) {
    return new DOMParser().parseFromString(content, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  }

  return content
    .replace(/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getNoticeExcerpt(content: string, maximumLength = 180) {
  const text = noticeToPlainText(content)
  if (text.length <= maximumLength) return text
  return `${text.slice(0, maximumLength).trimEnd()}…`
}

export function NoticeContent({ content, className }: { content: string; className?: string }) {
  if (!content.trim()) {
    return <p className={cn('text-sm text-muted-foreground', className)}>该公告暂无正文内容。</p>
  }

  let body: ReactNode
  if (typeof DOMParser !== 'undefined' && looksLikeHtml(content)) {
    const document = new DOMParser().parseFromString(content, 'text/html')
    body = renderChildren(document.body, 'notice')
  } else {
    body = renderPlainText(content)
  }

  return (
    <div className={cn('flex flex-col gap-3 break-words text-sm leading-7 text-muted-foreground', className)}>
      {body}
    </div>
  )
}
