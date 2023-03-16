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
  } from "carbon-components-svelte";

  let isSideNavOpen = false;
</script>

<Header company="Katch Assets" platformName="Live Tracking" bind:isSideNavOpen>
  <svelte:fragment slot="skip-to-content">
    <SkipToContent />
  </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/track" text="Track" />
  </HeaderNav>
</Header>

<Content>
  <Grid>
    <Row>
      <Column>
        <slot/>
      </Column>
    </Row>
  </Grid>
</Content>