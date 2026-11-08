import { Component, DestroyRef, HostListener, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeService } from '../../services/theme.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css'],
    standalone: false
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  isToolsOpen = false;
  isToolPage = false;

  constructor(
    private router: Router,
    private destroyRef: DestroyRef,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.isToolPage = this.router.url !== '/';
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.isToolPage = this.router.url !== '/';
        this.closeAll();
      });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (!this.isMenuOpen) this.isToolsOpen = false;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  toggleTools(event: Event): void {
    event.stopPropagation();
    this.isToolsOpen = !this.isToolsOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element) {
      if (!target.closest('.tools-menu')) this.isToolsOpen = false;
      if (!target.closest('#primary-menu') && !target.closest('.menu-toggle-v2')) {
        this.closeAll();
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isToolsOpen = false;
    this.isMenuOpen = false;
  }

  closeAll(): void {
    this.isMenuOpen = false;
    this.isToolsOpen = false;
  }

  goBack(): void {
    this.closeAll();
    this.router.navigateByUrl('/');
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (window.innerWidth > 720) this.isMenuOpen = false;
  }

}
