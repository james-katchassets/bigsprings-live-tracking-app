<script>
  //Vercel Analytics
  import { dev } from '$app/environment';
  import { inject } from '@vercel/analytics';
  
  inject({ mode: dev ? 'development' : 'production' });
  //End Vercel Analytics

  import '@carbon/styles/css/styles.css';
  import 'carbon-components-svelte/css/white.css';
  import {
    Header,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    SkipToContent,
    Content,
    Grid,
    Row,
    Column,
	SideNav,
	SideNavItems,
	SideNavLink,
	SideNavMenu,
  } from "carbon-components-svelte";
	import { goto } from '$app/navigation';
  

  let isSideNavOpen = false;
</script>

<Header company="Katch Assets" platformName="Live Tracking" bind:isSideNavOpen persistentHamburgerMenu={true}>
  <svelte:fragment slot="skip-to-content">
    <SkipToContent />
  </svelte:fragment>
</Header>
<SideNav bind:isOpen={isSideNavOpen} fixed >
  <SideNavItems>
    <SideNavMenu text="UKE" expanded>
      <SideNavLink text="e89f6de809f4" href="#" on:click={ () => { goto("/track/e89f6de809f4"); isSideNavOpen = false;} } />
      <SideNavLink text="e89f6de809f8" href="#" on:click={ () => { goto("/track/e89f6de809f8"); isSideNavOpen = false;} } />
      <SideNavLink text="e89f6de809e8" href="#" on:click={ () => { goto("/track/e89f6de809e8"); isSideNavOpen = false;} } />
      <SideNavLink text="e89f6de809ec" href="#" on:click={ () => { goto("/track/e89f6de809ec"); isSideNavOpen = false;} } />
      <SideNavLink text="e89f6de809dc" href="#" on:click={ () => { goto("/track/e89f6de809dc"); isSideNavOpen = false;} } />
      <SideNavLink text="e89f6de80a28" href="#" on:click={ () => { goto("/track/e89f6de80a28"); isSideNavOpen = false;} } />
    </SideNavMenu>
    <SideNavMenu text="NZ" expanded >
      <SideNavLink text="e89f6de809fc" href="#" on:click={ () => { goto("/track/e89f6de809fc"); isSideNavOpen = false;} } />
      <SideNavLink text="e89f6de80a04" href="#" on:click={ () => { goto("/track/e89f6de80a04"); isSideNavOpen = false;} } />
    </SideNavMenu>
  </SideNavItems>
</SideNav>
<Content>
  <slot/>
</Content>