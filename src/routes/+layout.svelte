<script>
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
    <SideNavLink text="e89f6de809f4" href="#" on:click={ () => { goto("/track/e89f6de809f4"); isSideNavOpen = false;} } />
    <SideNavLink text="e89f6de809f8" href="#" on:click={ () => { goto("/track/e89f6de809f8"); isSideNavOpen = false;} } />
    <SideNavLink text="e89f6de809e8" href="#" on:click={ () => { goto("/track/e89f6de809e8"); isSideNavOpen = false;} } />
    <SideNavLink text="e89f6de809ec" href="#" on:click={ () => { goto("/track/e89f6de809ec"); isSideNavOpen = false;} } />
    <SideNavLink text="e89f6de809dc" href="#" on:click={ () => { goto("/track/e89f6de809dc"); isSideNavOpen = false;} } />
  </SideNavItems>
</SideNav>
<Content>
  <slot/>
</Content>