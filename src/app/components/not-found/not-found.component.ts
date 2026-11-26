import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="not-found" aria-labelledby="not-found-title">
      <p class="eyebrow">404 · PAGE NOT FOUND</p>
      <h1 id="not-found-title">This tool isn’t here.</h1>
      <p>Check the address or return to the toolbox to find what you need.</p>
      <a routerLink="/">Browse all tools</a>
    </section>
  `,
  styles: [`
    :host { display:block; }
    .not-found { display:grid; min-height:50vh; place-content:center; justify-items:start; gap:12px; width:min(100% - 40px,720px); margin:auto; color:var(--ink); }
    .eyebrow { margin:0; color:var(--brand); font-size:12px; font-weight:700; letter-spacing:.08em; }
    h1 { margin:0; font-size:clamp(2rem,5vw,3rem); }
    p:not(.eyebrow) { margin:0; color:var(--muted); }
    a { display:inline-flex; align-items:center; min-height:44px; margin-top:8px; padding:0 16px; border-radius:var(--radius-md); background:var(--brand); color:var(--on-brand); font-weight:700; text-decoration:none; }
    a:focus-visible { outline:3px solid var(--focus-ring); outline-offset:3px; }
  `],
})
export class NotFoundComponent {}
