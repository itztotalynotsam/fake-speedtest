# fake-speedtest
 Code name: Testspeed
A configurable fake speedtest website with simulated network behavior, connection types, ISPs, servers, weather effects, and connection failures.

## Disclaimer

This speed test is a **simulation** and does not perform real network speed measurements.

It is provided for informational, testing, demonstration, and entertainment purposes only. **Do not use the results to falsely advertise, misrepresent, or make misleading claims about the performance of an internet service, network, or product.**

Actual speed-test results can vary depending on network conditions, server location, device hardware, network congestion, and other factors.

## Features

### Core Simulation

- Animated semicircle gauge with:
  - Needle
  - Glowing arc
  - Fading trail
  - Smooth easing
  - Subtle wobble
- Three-phase test:
  - Ping
  - Download
  - Upload
- Each phase has its own automatically scaled gauge.
- Realistic simulated signal behavior:
  - TCP-style ramp-up
  - Layered sine + noise jitter
  - Random congestion dips
  - Packet-loss glitches
- Results are averaged over the post-ramp steady-state window to imitate a real speed test.
- Automatic Mbps/Gbps/Tbps formatting.
- Maximum displayed speed: **1 Tbps**
- Completion timestamp displayed under the results:
  - `Test completed [date] at [time]`

### Connection Presets

**104 connection presets across 11 categories.**

#### Fiber

- 100 Mbps → 10 Gbps
- GPON
- XGS-PON
- 25G PON
- Other named fiber tiers

#### Cable

- Basic cable
- DOCSIS tiers
- DOCSIS 4.0 multi-gig

#### DSL

- Basic DSL
- ADSL2+
- VDSL2
- G.fast

#### Wi-Fi

- Wi-Fi 4
- Wi-Fi 5
- Wi-Fi 6
- Wi-Fi 7
- Old Router
- Apartment Wi-Fi
- Home Mesh
- Gaming Ethernet
- Public Hotspot
- Dorm Ethernet
- Powerline Extender
- Mesh Dead Zone

#### WISP

- 10–150 Mbps tiers
- Licensed Microwave
- E-band
- airFiber-class PtP backhaul
- 5 GHz
- 11 GHz
- 24 GHz
- 60 GHz

#### Mobile & Cellular

- 2G EDGE
- 3G
- 4G/LTE
- 4G+
- 5G NSA
- 5G SA
- 5G mmWave
- 5G Advanced
- 5G Home Internet
- Throttled Mobile
- OpenRAN Private 5G

#### Satellite

- GEO
- MEO
- LEO
- LEO Priority
- LEO Maritime
- LEO Aviation
- Starlink Mini
- Direct-to-Cell

#### Shared / Legacy / Novelty

- Dial-Up 56k
- ISDN
- Basic Broadband
- Public Wi-Fi
- Hotel Wi-Fi
- Campus Wi-Fi
- Community Mesh

#### Business & Emerging Technology

- T1
- EFM
- Metro Ethernet
- SD-WAN
- 5G URLLC
- TV White Space
- 6G Preview
- FSO laser
- Submarine cable
- VSAT
- NB-IoT
- LoRaWAN
- Corporate VPN

#### Data Center & Backbone

- 10GbE
- Higher-speed Ethernet
- Up to 800ZR+ coherent optical

#### Niche & Retro Technology

- Li-Fi
- Token Ring
- Bluetooth Tethering
- Zigbee
- Thunderbolt Bridge

### Server Locations

- **142 server locations**
- Every European country is represented.
- Multiple competing corporate-parody ISPs are available in major markets, including:
  - France
  - Germany
  - United Kingdom
  - Spain
  - Italy
  - Poland
  - Slovakia
  - And more
- 50+ additional countries are represented worldwide.
- Every server location has its own latency offset.
- Custom Server option with free-text input.

### ISP & Configuration

- ISP dropdown containing all **141 provider names** used by the server list.
- Custom ISP text field.
- Custom device name field.
- Technology preset dropdown with realistic antenna/specification descriptions.
- Custom technology option.
- Precise download/upload target inputs:
  - Minimum: **0.01 Mbps**
  - Maximum: **1,000,000 Mbps**
- Adjustable sliders for:
  - Ping
  - Jitter
  - Instability
  - Packet loss
  - Test duration

### IP Address Simulation

Randomized IP addresses adapt to the selected connection type.

Supported modes:

- Public IPv4
- CGNAT
  - Uses the real `100.64.0.0/10` CGNAT address range
- Dual-stack IPv6

The simulated IP updates automatically when connection presets are changed.

### Weather Effects

Optional weather-based connection simulation with six conditions:

- Clear
- Light Rain
- Heavy Rain
- Thunderstorm
- Snow
- Dense Fog

Weather effects vary depending on the selected technology.

- Satellite and FSO connections are affected the most.
- WISP and microwave connections are moderately affected.
- Wired connections are unaffected.

A live status line describes the expected impact of the selected weather condition.

### Connection Failure Simulation

Instead of running a speed test, the connection can be configured to fail.

Includes **15 preset error codes/messages**, plus:

- Randomized error selection
- Custom error code
- Custom error message

### Network-Type Icon Badge

- 20 custom SVG network-type icons.
- Icons are automatically assigned based on the selected preset.
- Manual icon override is supported.

## Error List

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

Errors can be randomized or selected manually.

## Presets

There are **104 connection presets** across 11 categories.

The complete preset list is available directly within the application.

## AI Disclosure

This project was generated with assistance from **Claude by Anthropic**.

AI-generated code has been reviewed, modified, or configured by me.
