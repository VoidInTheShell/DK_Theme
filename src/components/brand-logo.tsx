import { appConfig } from '@/lib/config';

export function BrandLogo() {
  return (
    <div className='flex min-w-0 items-center gap-3'>
      <div className='flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sky-200/80 bg-sky-50/90 shadow-sm dark:border-sky-400/20 dark:bg-sky-400/10'>
        <img src={appConfig.brandMarkUrl} alt='' className='h-9 w-10 object-contain' />
      </div>
      <div className='min-w-0'>
        <div className='truncate font-semibold tracking-tight'>{appConfig.appName}</div>
      </div>
    </div>
  )
}
