import { Location } from '@angular/common';
import { Component, DoCheck, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css'],
    standalone: false
})
export class NavbarComponent implements OnInit, DoCheck {
  isMenuOpen = false;
  isToolsOpen = false;
  isToolPage = false;

  constructor(private router: Router, private location: Location) {}

  ngOnInit(): void {
    this.checkScreenSize();
  }

  ngDoCheck(): void {
    this.isToolPage = window.location.pathname !== '/';
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
    if (target instanceof Element && !target.closest('.tools-menu')) {
      this.isToolsOpen = false;
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
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
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
