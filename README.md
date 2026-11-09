# fake-speedtest

**Code name:** TestSpeed

A highly configurable fake speed test website featuring simulated network behaviour, connection types, ISPs, server locations, weather effects, connection failures, and animated visualisations.

**Open:** https://itztotalynotsam.github.io/fake-speedtest

---

## Disclaimer

This speed test is a **simulation** and does not perform real network speed measurements.

It is provided for informational, testing, demonstration, and entertainment purposes only. **Do not use the results to falsely advertise, misrepresent, or make misleading claims about the performance of an internet service, network, or product.**

Actual speed-test results can vary depending on network conditions, server location, device hardware, network congestion, and other factors.

---

# Features

## Core Speed Test

The speed test runs in three phases:

1. **Server search** – A short server discovery phase.
2. **Ping** – Measures simulated idle latency.
3. **Download** – Simulates download performance.
4. **Upload** – Simulates upload performance.

Each phase has its own progress bar, and the test duration is configurable from **2 to 60 seconds**.

### Results

Four result tiles display:

- Ping
- Download speed
- Upload speed
- Packet loss

Additional information includes:

- Idle ping and jitter displayed beneath the main ping value.
- Download ping (latency under download load).
- Upload ping (latency under upload load).
- Test completion timestamp.
- A live download/upload graph showing speed over time.

### Live Speed Gauge

An animated semicircle gauge featuring:

- Animated needle.
- Glowing gradient arc.
- Glowing needle tip.
- Fading trail.
- Smooth easing.
- Subtle needle wobble.

The gauge supports three configurable maximum scales:

- 100 Mbps
- 1 Gbps
- 10 Gbps

If the actual simulated speed exceeds the selected gauge maximum, the needle stops at the end of the gauge while the numerical speed display remains accurate.

### Speed Test Quality Verdict

After every test, a quality assessment evaluates the simulated connection for:

- 4K video streaming.
- Video calls.
- Online gaming.
- Estimated time to download a 50 GB file.

### Result Export

**Save result image** exports the completed test as a **1200 × 630 PNG**, using the currently selected theme.

### Test History

The last **8 tests** are stored locally in the browser.

A trend line visualises previous results, allowing users to compare their connection performance over time.

---

## Connection Simulation

The application includes **104 connection presets across 11 categories**, covering everything from legacy dial-up connections to modern fibre, mobile networks, satellite and enterprise infrastructure.

Every preset defines simulated:

- Download speed.
- Upload speed.
- Ping.
- Jitter.
- Instability.
- Packet loss.

All numerical values can be manually edited.

### Connection Presets

#### Fibre

- 100 Mbps to 10 Gbps.
- GPON.
- XGS-PON.
- 25G PON.
- Other named fibre tiers.

#### Cable

- Basic cable.
- DOCSIS tiers.
- DOCSIS 4.0 multi-gig.

#### DSL

- Basic DSL.
- ADSL2+.
- VDSL2.
- G.fast.

#### Wi-Fi and Local Networks

- Wi-Fi 4.
- Wi-Fi 5.
- Wi-Fi 6.
- Wi-Fi 7.
- Old Router.
- Apartment Wi-Fi.
- Home Mesh.
- Gaming Ethernet.
- Public Hotspot.
- Dorm Ethernet.
- Powerline Extender.
- Mesh Dead Zone.

#### Wireless Internet Service Providers (WISP)

- 10–150 Mbps tiers.
- Licensed Microwave.
- E-band.
- airFiber-class PtP backhaul.
- 5 GHz.
- 11 GHz.
- 24 GHz.
- 60 GHz.

#### Mobile and Cellular

- 2G EDGE.
- 3G.
- 4G/LTE.
- 4G+.
- 5G NSA.
- 5G SA.
- 5G mmWave.
- 5G Advanced.
- 5G Home Internet.
- Throttled Mobile.
- OpenRAN Private 5G.

#### Satellite

- GEO.
- MEO.
- LEO.
- LEO Priority.
- LEO Maritime.
- LEO Aviation.
- Starlink Mini.
- Direct-to-Cell.

#### Shared, Legacy and Novelty

- Dial-Up 56k.
- ISDN.
- Basic Broadband.
- Public Wi-Fi.
- Hotel Wi-Fi.
- Campus Wi-Fi.
- Community Mesh.

#### Business and Emerging Technology

- T1.
- EFM.
- Metro Ethernet.
- SD-WAN.
- 5G URLLC.
- TV White Space.
- 6G Preview.
- FSO laser.
- Submarine cable.
- VSAT.
- NB-IoT.
- LoRaWAN.
- Corporate VPN.

#### Data Centre and Backbone

- 10GbE.
- Higher-speed Ethernet.
- Up to 800ZR+ coherent optical.

#### Niche and Retro Technology

- Li-Fi.
- Token Ring.
- Bluetooth Tethering.
- Zigbee.
- Thunderbolt Bridge.

---

## Simulation Realism

The application uses several techniques to make simulated connections behave more realistically.

### Speed Behaviour

- TCP-style speed ramp-up.
- Small initial overshoot.
- Layered sine-wave and noise-based jitter.
- Random congestion dips.
- Packet-loss glitches.
- Each run finishes a few percent above or below the configured target.
- Results are averaged over the best 80% of samples to imitate a real speed test.

### Time-Based Behaviour

Congestion dips and packet loss are calculated using elapsed time rather than screen refresh rate.

This ensures consistent simulation behaviour across different display refresh rates.

### Bufferbloat

Loaded latency increases as the connection becomes busy.

Download and upload ping therefore respond dynamically to the simulated network load.

### Speed Formatting

Automatic Mbps/Gbps/Tbps formatting.

- Maximum numerical display: **1 Tbps**.

---

## ISP and Server Configuration

### Server Locations

The application includes **142 server locations**.

Features include:

- Representation of every European country.
- More than 50 additional countries worldwide.
- Multiple competing corporate-parody ISPs in major markets.

Major represented markets include:

- France.
- Germany.
- United Kingdom.
- Spain.
- Italy.
- Poland.
- Slovakia.
- And more.

Every server location has its own latency offset.

A custom server option allows users to enter their own server name.

### ISP Selection

The ISP dropdown contains **141 provider names** used by the server list.

Additional configuration options include:

- Custom ISP name.
- Custom device name.
- Technology description.
- Custom technology description.
- Custom server name.

Technology presets include realistic antenna and network specification descriptions.

### Adjustable Connection Parameters

Download and upload targets can be configured precisely:

- Minimum: **0.01 Mbps**.
- Maximum: **1,000,000 Mbps**.

Additional adjustable parameters:

- Ping.
- Jitter.
- Instability.
- Packet loss.
- Test duration.

---

## IP Address Simulation

The application generates a randomized fake IP address for each test.

Supported address modes:

- Public IPv4.
- CGNAT.
- Dual-stack IPv6.

### CGNAT

Uses the real `100.64.0.0/10` shared address range.

The simulated IP automatically updates when connection presets are changed.

IP address styles adapt to the selected connection type.

---

## Weather Effects

Weather can influence simulated connection performance.

Six conditions are supported:

- Clear.
- Light Rain.
- Heavy Rain.
- Thunderstorm.
- Snow.
- Dense Fog.

Weather sensitivity depends on the selected technology.

| Technology | Weather sensitivity |
|---|---|
| Wired fibre | Unaffected |
| Cable and DSL | Unaffected |
| Wi-Fi | Configurable |
| Mobile networks | Technology-dependent |
| WISP | Moderate |
| Microwave | Moderate |
| Satellite | High |
| FSO laser | High |

A live status line describes the expected impact of the selected weather condition.

### Weather-Based Themes

The Weather theme also follows the selected weather preset.

The background changes to match the simulated conditions:

- Clear night.
- Rain.
- Thunderstorm with lightning.
- Snow.
- Fog.

---

## Time-of-Day Simulation

Three operating modes are available:

- Ignore time.
- Use the device's local clock.
- Evening peak.
- Late night.

Shared connections such as cable, Wi-Fi and mobile networks experience significantly greater simulated performance reductions during busy periods.

Dedicated connections are affected much less.

---

## Signal and Distance Simulation

Wireless connections support additional signal and distance simulation.

Wired connections automatically ignore these settings.

### Signal Presets

- Auto.
- Right next to the cell.
- Good.
- Fair.
- Poor.
- Custom.

Custom configuration supports:

- Distance in metres.
- Wall attenuation in dB.

### Movement Simulation

Users can simulate:

- Standing still.
- Walking towards the cell.
- Walking away from the cell.
- Driving towards the cell.
- Driving away from the cell.

Distance changes dynamically during the test.

Signal strength also slowly fades over time.

### Signal Behaviour

Weaker signal results in:

- Lower download speed.
- Lower upload speed.
- Higher ping.
- Higher jitter.
- Increased packet loss.

### Live Signal Readout

Wireless connections display:

- Signal strength in dBm.
- Signal quality.
- Distance from the simulated cell.

This allows users to observe how changing signal conditions affect connection performance.

---

## Connection Failure Simulation

The application can simulate a complete connection failure instead of running a speed test.

Includes **15 predefined error codes and messages**, with additional custom options.

Supported errors:

| Error Code | Message |
|---|---|
| `ERR_CONN_REFUSED` | Failed to connect to network. Contact your provider for further information. |
| `ERR_DNS_NXDOMAIN` | DNS resolution failed |
| `ERR_CONN_TIMEOUT` | Connection timed out |
| `ERR_AUTH_401` | Authentication/session expired |
| `ERR_NO_CARRIER_SIGNAL` | No modem/ONT signal |
| `ERR_GATEWAY_UNREACHABLE` | Router unreachable |
| `ERR_SERVER_503` | Server unavailable |
| `ERR_ISP_MAINTENANCE` | Scheduled maintenance |
| `ERR_RATE_LIMIT_429` | Too many requests |
| `ERR_FIREWALL_BLOCKED` | Blocked by firewall |
| `ERR_LINK_DOWN` | Cable/link down |
| `ERR_ACCOUNT_SUSPENDED` | Billing issue |
| `ERR_CONGESTION_LOCAL` | Local network congestion |
| `ERR_PACKET_LOSS_CRIT` | Critical packet loss |
| `ERR_UNKNOWN_0x8007045D` | Unknown error |

Failure configuration supports:

- Random error selection.
- Manual error selection.
- Custom error code.
- Custom error message.

---

## Connection Scenarios

Additional scenarios allow users to simulate specific network situations:

- **Speed boost then drop:** Connection speed temporarily increases before dropping.
- **Data cap reached:** Connection performance changes when a simulated data cap is reached mid-test.
- **Wi-Fi signal wobble:** Wireless signal conditions fluctuate during the test.

---

## Network-Type Icons

The application includes **20 custom SVG network-type icons**.

Features:

- Automatic icon assignment based on the selected connection preset.
- Manual icon override.
- Custom visual identification of different network technologies.

---

# Look and Feel

The interface features four distinct visual themes.

## Aurora

<details>
<summary>Theme description</summary>

- Animated aurora curtains.
- Star-filled night sky.
- Shooting stars.
- Treeline silhouette.
- Randomised moon and planetary objects on each page load.
- Possible celestial objects include Venus, Jupiter, Saturn and Mars.

</details>

## Galaxy

<details>
<summary>Theme description</summary>

- Spinning spiral galaxy.
- Nebula background.
- Animated stars.
- Space-inspired visual atmosphere.

</details>

## Basic Dark

<details>
<summary>Theme description</summary>

- Flat dark background.
- Subtle accent-colour glow.
- Minimalist interface.
- Reduced visual distractions.

</details>

## Weather

<details>
<summary>Theme description</summary>

A dynamic night sky that follows the selected weather preset.

- Clear night.
- Rain.
- Thunderstorm with lightning.
- Snow.
- Fog.

</details>

### Dynamic Test Visualisation

The sky reacts to the speed test.

- Higher speeds produce brighter visual effects.
- Ping, download and upload each have their own colour scheme.
- Errors use red visual effects.
- All interface colours adapt to the active theme.

### Accessibility

Users with reduced-motion preferences receive a still sky instead of animated backgrounds.

### Controls and Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Start a speed test |
| `Escape` | Close the settings drawer |

### Settings Sharing

**Copy settings link** generates a URL that restores the complete configuration when opened.

This allows users to share their simulated network setup with others.

---

# Data and Persistence

The application stores the last 8 speed test results in the browser.

Stored history is used to generate a trend line and compare previous tests.

Configuration sharing is handled through URL parameters, allowing settings to be restored without manually configuring everything again.

---

# Technical and Visual Details

- Custom animated SVG gauge.
- Live download/upload performance graph.
- Dynamic weather and sky effects.
- 20 custom SVG network icons.
- Responsive interface.
- Local browser-based test history.
- Configurable simulation engine.
- Automatic speed unit formatting.
- Reduced-motion support.
- Exportable 1200 × 630 PNG results.

Every JavaScript file contains explanatory `//` comments.

CSS and HTML use their respective comment syntax.

---

# AI Disclosure

This project was generated with assistance from **Claude by Anthropic**.

AI-generated code has been reviewed, modified, or configured by me.

---

# Open Source

This project is fully open source. Feel free to contribute to the repository!

**Made with love in Slovakia <3**
