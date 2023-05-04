<script>
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

  let isSideNavOpen = false;
</script>

<Header company="Katch Assets" platformName="Live Tracking" bind:isSideNavOpen>
  <svelte:fragment slot="skip-to-content">
    <SkipToContent />
  </svelte:fragment>
</Header>
<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink text="e89f6de809f4" href="/track/e89f6de809f4" />
    <SideNavLink text="e89f6de809f8" href="/track/e89f6de809f8" />
    <SideNavLink text="e89f6de809e8" href="/track/e89f6de809e8" />
    <SideNavLink text="e89f6de809ec" href="/track/e89f6de809ec" />
    <SideNavLink text="e89f6de809dc" href="/track/e89f6de809dc" />
  </SideNavItems>
</SideNav>
<Content>
  <Grid>
    <Row>
      <Column>
        <slot/>
      </Column>
    </Row>
  </Grid>
</Content>