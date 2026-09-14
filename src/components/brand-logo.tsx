import { useSiteBranding } from '@/lib/site-branding'

export function BrandLogo() {
  const brand = useSiteBranding()
  return (
    <div className='flex min-w-0 items-center gap-3'>
      <div className='flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sky-200/80 bg-sky-50/90 shadow-sm dark:border-sky-400/20 dark:bg-sky-400/10'>
        <img src={brand.logo} alt='' className='h-9 w-10 object-contain' />
      </div>
      <div className='min-w-0'>
        <div className='truncate font-semibold tracking-tight'>{brand.appName}</div>
        {brand.description ? <div className="max-w-64 truncate text-xs text-muted-foreground" title={brand.description}>{brand.description}</div> : null}
      </div>
    </div>
  )
}
