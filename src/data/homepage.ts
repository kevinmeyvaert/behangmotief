/** Curated photos for the homepage hero, featured festivals and service cards. */

export const heroImages = [
  {
    src: "https://media.wannabes.be/5080/2025-05-25-balthazar-pukkelpop-pukkelpop-2023-qsbntqa3fg52bzigc-qsbntqA3fg52bzigc.jpg?v=1787917238",
    blurhash: "LVECwZ?angt7.Tx]V?s:59SiRjWB",
    alt: "Pukkelpop 2023",
  },
  {
    src: "https://media.wannabes.be/26401/2022-09-01-fred-again-pukkelpop-pukkelpop-2022-ddgxaq4lgjcappsxz-ddGxAQ4LgjCappsXZ.jpg?v=1789532869",
    blurhash: "LcMOmN;KJ6%fvz~BI:M{JW9ui{S5",
    alt: "Fred Again.. at Pukkelpop 2022",
  },
  {
    src: "https://media.wannabes.be/40282/2022-09-01-tom-misch-pukkelpop-pukkelpop-2022-m3wsqyz4gqkdbpjbb-m3wSqYZ4GQkdBPjbb.jpg?v=1789533187",
    blurhash: "LiB5YEMy%fT0h2MyxtX8n,aKi^ax",
    alt: "Tom Misch at Pukkelpop 2022",
  },
  {
    src: "https://media.wannabes.be/1692/2025-03-16-brihang-coretec-dome-cjr3j5zj3eajpvzhx-CJr3j5ZJ3EAJPvZHX.jpg?v=1787915942",
    blurhash: "LW4z2gR3Z}awt:VqaJadV;ogW@ad",
    alt: "Brihang at Coretec Dome",
  },
  {
    src: "https://media.wannabes.be/17102/2023-08-25-bluai-pukkelpop-pukkelpop-2023-ojurs65ode9tae5js-oJuRS65ode9TAe5JS.jpg?v=1789532659",
    blurhash: "LAE{@H_O0400007~%zHr00k;m,.7",
    alt: "Bluai at Pukkelpop 2023",
  },
  {
    src: "https://media.wannabes.be/41835/2025-05-25-tale-of-us-tomorrowland-tomorrowland-2019-gj9vpr8hs5syzeaf4-GJ9vpR8hs5SYzeAF4.webp?v=1787697665",
    blurhash: "L82Q1uo#MHRPbLa$jDj[L}V@u6tR",
    alt: "Tale of Us at Tomorrowland 2019",
  },
  {
    src: "https://media.wannabes.be/57205/2023-07-14-nils-frahm-bijloke-gent-jazz-2023-gb27zrbmsdoyfik59-gB27ZRBmSDoyfiK59.jpg?v=1789105036",
    blurhash: "LHF:xZ9^0P^h}TEjEkNaRQNwxZI:",
    alt: "Nils Frahm at Gent Jazz 2023",
  },
];

export const projects = [
  {
    title: "Pukkelpop",
    imageUrl:
      "https://media.wannabes.be/40282/2022-09-01-tom-misch-pukkelpop-pukkelpop-2022-m3wsqyz4gqkdbpjbb-m3wSqYZ4GQkdBPjbb.jpg?v=1789533187",
    searchTerm: "Pukkelpop",
    blurhash: "LiB5YEMy%fT0h2MyxtX8n,aKi^ax",
  },
  {
    title: "Gent Jazz",
    imageUrl:
      "https://media.wannabes.be/5749/2024-07-15-the-bony-king-of-nowhere-bijloke-gent-jazz-2024-kxsczg2aubywmdkr3-KXsCzG2auBYwMdKr3.jpg?v=1789104916",
    searchTerm: "Gent Jazz",
    blurhash: "L67-7x%103IVB@t7$JRj1ANe]|xC",
  },
  {
    title: "Crammerock",
    imageUrl:
      "https://media.wannabes.be/35111/2024-09-08-equal-idiots-crammerock-crammerock-2024-ddkkycpenawzu9mws-ddKKYcpEnAwzu9mws.jpg?v=1789533063",
    searchTerm: "Crammerock",
    blurhash: "LMGkd;kX9aoe_4?Gs;V[%h-:M{WB",
  },
  {
    title: "Lokerse Feesten",
    imageUrl:
      "https://media.wannabes.be/76417/2022-08-06-froukje-lokerse-feesten-lokerse-feesten-2022-jcqoha95rnksd6qbh-jcQohA95rNKsD6qbh.jpg?v=1789105187",
    searchTerm: "Lokerse Feesten",
    blurhash: "L7F;WW0302~902?F^hv~0gt6=Z$g",
  },
  {
    title: "Boomtown",
    imageUrl:
      "https://media.wannabes.be/73178/2024-07-20-klakmatrak-kouter-boomtown-2024-2erjnb73jksbtsdhy-2erJnb73JKSBtsdhy.jpg?v=1787830743",
    searchTerm: "Boomtown",
    blurhash: "LYDw8xnfIT%M-@RhM{oL9DInRPRP",
  },
  {
    title: "Cactusfestival",
    imageUrl:
      "https://media.wannabes.be/69696/2023-07-10-shame-minnewaterpark-cactus-festival-2023-7nhwu3epc4z2njpfl-7NHWu3ePc4z2NJpfL.jpg?v=1787825981",
    searchTerm: "Cactusfestival",
    blurhash: "L5A0?#~q-;t79FRjt7xu00WBM{Rj",
  },
];

interface ServiceCard {
  key: 'festival' | 'concert' | 'social' | 'workshops' | 'licensing' | 'press';
  src: string;
  alt: string;
  blurhash: string;
  imageClass?: string;
  imageContainerClass?: string;
}

export const serviceCards: ServiceCard[] = [
  {
    key: "festival",
    src: "https://media.wannabes.be/1464/2023-08-25-bazart-pukkelpop-pukkelpop-2023-3tymwahlzjwcwmzg3-3TYMWAhLZjwcWMzG3.jpg?v=1787915860",
    alt: "Bazart at Pukkelpop 2023",
    blurhash: "LTBq0i?at6%2.T-o%1xax^xuxat6",
  },
  {
    key: "concert",
    src: "https://media.wannabes.be/41393/2024-07-19-air-bijloke-gent-jazz-2024-seppq6fjsaenz7ryh-sePPQ6FjsaeNz7RYh.jpg?v=1789104895",
    alt: "AIR at Gent Jazz 2024",
    blurhash: "L+KmOjs:M{xa~BoeRkofIoWCj[WB",
  },
  {
    key: "social",
    src: "/cactus-grid-liggend-klein.jpg",
    alt: "Cactusfestival social media grid",
    blurhash: "L4BL;r4rTh}]+?,BASStrH}bE3o~",
    imageContainerClass: "overflow-hidden",
  },
  {
    key: "workshops",
    src: "/workshop.jpg",
    alt: "Workshop",
    blurhash: "LQO3Ro%2t-xa_NoyVsjG-rn%WTof",
    imageContainerClass: "overflow-hidden",
    imageClass: "-translate-y-15",
  },
  {
    key: "licensing",
    src: "https://media.wannabes.be/32747/2024-03-14-loverman-vooruit-m4z7nrkpt52j9jtbn-M4z7NrkpT52j9JtBn.jpg?v=1789533012",
    alt: "Week van de Belgische Muziek",
    blurhash: "LAA^OK~q000000WB-;%M004n%M-;",
  },
  {
    key: "press",
    src: "https://media.wannabes.be/4840/2025-10-09-glintsal-pukkelpop-pukkelpop-2025-fpt3ctepkbnume3b5-fpT3CTEpkBnumE3b5.jpg?v=1787917148",
    alt: "Glintsal at Pukkelpop 2025",
    blurhash: "LGCEF7E#0#]-,@WVJ7s:1K#-}CBA",
  },
];
