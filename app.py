from flask import Flask, jsonify, render_template, request
import os 
import json
import markdown2
import pandas as pd
import geopandas as gpd
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')

load_dotenv()  

"""
Load Data
"""
# All surveillance data
all_data = os.getenv('ALL_DATA')
if not all_data:
    raise ValueError("Environment variable 'ALL_DATA' is not set.")
allSurve = pd.read_csv(all_data)
allSurve['Report_Date'] = pd.to_datetime(allSurve['Report_Date'])

# Population data
all_population = os.getenv('POPULATION_DATA')
if not all_population:
    raise ValueError("Environment variable 'POPULATION_DATA' is not set.")
allPopulation = pd.read_csv(all_population)

"""
Load Shapefiles
"""
#county
shapefile_path = Path('clean_shapefiles/county_shapefile.shp')
shapefile =gpd.read_file(shapefile_path)
shapefile_json = json.loads(shapefile.to_json())

#subcounty
sub_shapefile_path = Path('clean_shapefiles/subcounty_shapefile.shp')
sub_shapefile =gpd.read_file(sub_shapefile_path)
sub_shapefile_json = json.loads(sub_shapefile.to_json())

# ward 
ward_shapefilepath = Path('clean_shapefiles/gadm41_KEN_3.shp')
ward_shapefile = gpd.read_file(ward_shapefilepath)
ward_shapefile = ward_shapefile.rename(
    columns=
    {
        'NAME_1': 'county', 
        'NAME_2': 'sub_county', 
        'NAME_3': 'Ward'
    })
ward_shapefile_json = json.loads(ward_shapefile.to_json())


# debug 
#county
print(shapefile.columns)
print(shapefile['county'].unique())

#subcounty
print(sub_shapefile.columns)
print(sub_shapefile['sub_county'].unique())

#ward
print(ward_shapefile.columns)
print(ward_shapefile['Ward'].unique())

print(allSurve.head())
print(allSurve['county'].unique())

print(allPopulation.head())
print(allPopulation['Species'].unique())


# Diseases info dictionary
disease_info = {
    'asf': """
### African Swine Fever

#### **Key Words:**
* OIE List A Notifiable
* Fever
* Widespread bleeding
* High mortality rates in swine

#### **Disease:**
African Swine Fever Virus is an enveloped DNA virus (Family: *Asfarviridae*; Genus: *Asfivirus*).

#### **Animals Affected:**
All varieties of swine (both domestic and wild) are susceptible.

#### **Transmission in Animals:**
**Reservoir Hosts:** Wild swine species (warthogs, bush pigs, giant forest hogs) commonly carry the virus without showing clinical signs.  
**Biologic Vectors:** Soft Ticks (Genus: *Ornithodoros*) are the only insects that carry and spread the virus.  
**Direct Transmission:** Healthy pigs become infected through saliva, blood, or body fluids.  
**Indirect Transmission:** Occurs through fomites or consumption of infected meat products. ASFV is resistant to heat, cold, and a wide pH range, surviving in pig meat and fluids.

#### **Clinical Signs in Animals:**
*Peracute Form:* Sudden hemorrhagic death with few signs.  
*Acute Form:* High fever, vomiting, respiratory distress, and nearly 100% mortality in domestic swine.  
*Subacute Form:* Slight fever, loss of appetite, moderate mortality (30-70%).  
*Chronic Form:* Weight loss, respiratory issues, low mortality, but survivors can remain carriers.

#### **Diagnosis in Animals:**
**Differential Diagnosis:** Classical Swine Fever, Porcine Reproductive and Respiratory Syndrome, and others.  
**Diagnosis:** Virus isolation, antigen detection, PCR, or serological detection (ELISA).

#### **Prevention:**
Use biosecurity measures like double fencing, avoid untreated meat scraps, and maintain hygiene.  
In outbreaks, slaughter affected pigs and properly disinfect.

#### **Impact on Humans:**
This virus does not infect humans but significantly affects swine populations and farming economies.

**More Info:**  
[General](https://www.woah.org/en/disease/african-swine-fever/) | [Kenya](https://pmc.ncbi.nlm.nih.gov/articles/PMC11325071/)
""",

    'bru': """
### Brucellosis

#### **Key Words:**  
- Reproductive issues in animals  
- Highly contagious and zoonotic  

#### **Disease:**  
Brucella is a genus of bacteria (Gram-negative facultative intracellular coccobacilli).

#### **Animals Affected:**  
Different *Brucella* spp. affect different animals:
- Bovines are predominately infected with *Brucella abortus*, but can also be infected by *B. suis* or *B. melitensis*.
- Sheep and goats are predominately infected by *B. melitensis*.
- Swine are predominantly infected by *B. suis*.
- Canines are predominately infected by *B. canis*.
- Camelids are predominately infected by *B. melitensis* and *B. abortus*.

#### **Transmission in Animals:**  
**Direct Transmission:** Occurs when healthy animals come into contact with infected bodily fluids (e.g., placenta, vaginal discharges, aborted fetuses, and semen), milk from infected animals, or through inhalation of airborne agents.  
**Indirect Transmission:** Occurs when healthy animals ingest bacteria from contaminated environments, such as feed or water, or through cuts in the skin.

#### **Clinical Signs in Animals:**  
The disease is often mild in animals and causes reproductive issues (abortions, stillbirths, and infertility in both males and females). Other signs include decreased milk production, swelling in joints or testicles, lethargy, poor coat condition, and various non-reproductive symptoms.

#### **Diagnosis in Animals:**  
Several laboratory and field tests are routinely used, including serological tests (Buffered Brucella antigen test, Card agglutination test (CAT), Rose Bengal test (RBT), Complement fixation test (CFT), ELISAs), Milk Ring Test, real-time PCR, and lateral flow immunochromatography assay (LFA).

#### **Prevention in Animals:**  
Regular testing, animal movement restrictions, and maintaining good biosecurity on farms help control brucellosis. Sick animals should be isolated and slaughtered, and contaminated materials like aborted fetuses should be safely disposed of via incineration.  
- Sodium hydroxide is the preferred disinfectant for animal housing, and sodium hypochlorite is preferred for laboratory settings.  
- In Kenya, two vaccines are used for livestock: *Brucella abortus* S19 for cattle (increasing resistance to infection after vaccination at 5-8 months), and *Brucella melitensis* Rev.1 for sheep and goats (providing protection for at least 4.5 years). While these vaccines help control brucellosis, they cannot fully eradicate the disease and may pose risks to both animals and humans.

#### **Treatment in Animals:**  
No practical treatment is available.

#### **Impact on Humans:**  
Brucellosis, or 'Undulant Fever,' is a major zoonotic disease. It is primarily transmitted via consumption of raw dairy products, but veterinarians, farmers, and abattoir workers have occupational risks. It causes severe illness in humans, with symptoms like fever, fatigue, weight loss, and joint pain, often confused with other febrile diseases like malaria. The disease can be chronic and recurrent if not treated properly, requiring long-term antibiotic therapy.  
The best preventative measures are pasteurization or heating milk to 80–85°C for 30 minutes, taking proper protective measures (e.g., PPE), and preventing the disease in animals.

#### **Link to More Information:**  
- [General](https://www.woah.org/en/disease/brucellosis/)  
- [Kenya](http://guidelines.health.go.ke:8000/media/Brucellosis-Control-Strategy_Kenya_2021-2040.pdf) | [Research](https://www.nature.com/articles/s41598-023-47628-1)
""",
    'bov': """
## Contagious Bovine Pleuropneumonia (CBPP)

#### **Key Words**: 
- OIE List A Notifiable
- Fever
- Respiratory distress, 50% mortality with chronic carriers in bovine

#### **Disease**: 
*Mycoplasma mycoides* subsp. *Mycoides* is a bacteria (pleomorphic, lacking a cell wall).

#### **Animals Affected**: 
Bovine (*Bos taurus* and *Bos indicus*) are the main hosts.

#### **Transmission in animals**:
- **Direct transmission**: Occurs when healthy animals inhale droplets from infected coughing animals. Transmission typically occurs under close and repeated contact, though it can occur up to 200 meters under specific conditions. Less common forms of transmission include contact with saliva, urine, fetal membranes, uterine discharges, and transplacental infection.
- **Indirect transmission**: Not clinically significant.

#### **Clinical signs in animals**:
- **Acute Cases**: Bovine display a fever (up to 42°C), inappetence, respiratory discomfort, and stand alone in the shade with head and neck extended. The disease progresses to dyspnea, thoracic pain, and death within 1–3 weeks if untreated. Mortality rate up to 50%. Calves may develop polyarthritis causing swollen joints and lameness.
- **Chronic Cases**: Bovine exhibit poor body condition, mild fever, and coughing, especially with exercise. Chronically infected animals may recover but can shed bacteria for up to 2 years.

#### **Diagnosis in animals**:
- **Differential Diagnosis**: Acute bovine pasteurellosis, hemorrhagic septicemia, theileriosis, bovine ephemeral fever, traumatic pericarditis.
- **Necropsy**: One lung often appears marbled with edema, fibrin, and necrotic tissue. The thoracic cavity contains yellow or turbid fluid.
- **Samples**: Nasal swabs, lung washings, pleural fluid, blood, and sera. Serological tests (complement fixation, latex agglutination, or ELISA) diagnose the disease, with confirmation via isolation of *mycoplasma*, PCR assays, or immunoblotting.

#### **Prevention in animals**:
- Vaccines: T1/44 (one-year protection, but may have residual virulence) and T1sr (six-month protection, no virulence). 
- Control methods: Early outbreak detection, restricting animal movements, stamping-out policy, abattoir inspections, and blood testing.
- **Disinfectants**: Sodium hypochlorite, ethanol, iodophores, gluteraldehyde, peracetic acid.

#### **Treatment in animals**: In endemic areas, antibiotic treatment with Tylosin (10 mg/kg, IM, every 12 hours for 3 days) and Danofloxacin 2.5% (2.5 mg/kg/day for 3 consecutive days) can be effective.

#### **Impact on humans**: This bacteria does not infect humans, but CBPP significantly threatens bovine populations and the farming economy.

#### **Link to more**:
[General CBPP Info](https://www.woah.org/en/disease/contagious-bovine-pleuropneumonia/) | [CBPP in Kenya](https://www.sciencedirect.com/science/article/abs/pii/S0167587714001172)
""",
    'cap': """
## Contagious Caprine Pleuropneumonia (CCPP)

#### **Key Words**: 
- Fever
- Respiratory distress, 80% mortality in goats

#### **Disease**:
*Mycoplasma capricolum capripneumoniae* is a bacteria (pleomorphic, lacking a cell wall).

#### **Animals Affected**:  
- Goats are the primary domesticated hosts, though sheep and wild ruminants can also be affected.

#### **Transmission in animals**:
- **Direct transmission**: Occurs when healthy animals inhale droplets from infected coughing animals. Transmission occurs under close and repeated contact, and up to 50 meters in certain conditions. Outbreaks can be triggered by heavy rains, cold spells, or long-distance transport.
- **Indirect transmission**: Not clinically significant.

#### **Clinical signs in animals**:
- **Peracute Form**: Goats may die within 1-3 days with minimal clinical signs.
- **Acute Form**: Goats develop a fever (up to 43°C), inappetence, coughing, dyspnea, and abortions. Before death, goats may become immobile, with frothy nasal discharge and drooling.
- **Chronic Form**: Goats exhibit a chronic cough, nasal discharge, and debilitation.

#### **Diagnosis in animals**:
- **Differential Diagnosis**: Peste de petits ruminants, pasteurellosis, contagious agalactia syndrome.
- **Necropsy**: One lung appears nodular due to edema, fibrin, and necrosis. Thoracic cavity is often filled with straw-colored fluid.
- **Samples**: Lung lesions, pleural fluid, exudates from lung lesions. Serological tests (complement fixation, latex agglutination, or ELISA) diagnose the disease. Confirmation is done by isolating *mycoplasma* or using PCR assays.

#### **Prevention in animals**:
- Vaccine: One inactivated *Mccp* vaccine provides protection for one year.
- Control methods: Strict quarantine, movement controls, vaccination, biosecurity measures.
- **Disinfectants**: Sodium hypochlorite, ethanol, iodophores, gluteraldehyde, peracetic acid.

#### **Treatment in animals**: 
Antibiotic treatment with Tylosin (10 mg/kg, IM, every 24 hours for 3 days) or long-acting oxytetracycline (20 mg/kg, IM, once) has been effective.

#### **Impact on humans**: 
This bacteria does not infect humans but poses a significant threat to goat populations and the farming economy.

#### **Link to more**:
[General CCPP Info](https://www.woah.org/en/disease/contagious-caprine-pleuropneumonia/) | [CCPP in Kenya](https://pubmed.ncbi.nlm.nih.gov/31376342/)
""",
    'fmd': """
## Foot and Mouth Disease (FMD)

#### **Key Words**: 
- OIE List A Notifiable
- Blistering lesions in cloven-hoofed animals

#### **Disease**:
Foot and Mouth Disease is caused by a non-enveloped single-stranded RNA virus (Family: *Picornaviridae*; Genus: *Aphthovirus*).

#### **Animals Affected**: 
Cloven-hoofed animals, including bovine, swine, sheep, goats, and camelids. African buffalo are significant carriers for FMDV.

#### **Transmission in animals**:
- **Direct transmission**: Occurs when healthy animals come into contact with infected animals or their bodily fluids (respiratory secretions, saliva, milk, semen).
- **Indirect transmission**: Occurs via contaminated fomites (farm equipment, clothing, vehicles). Airborne agents can spread the virus over long distances, or it can enter through ingestion of infected meat or skin wounds.

#### **Clinical signs in animals**:
- **Key Signs**: Fever (~40°C), vesicular lesions on the tongue, lips, mouth, teats, and between the hooves. These lesions can rupture, forming erosions, leading to lameness and predisposing to secondary bacterial infections. Mortality rates in young animals can exceed 20%.

#### **Diagnosis in animals**:
- **Differential Diagnosis**:
  - **Ruminants**: Vesicular stomatitis
  - **Swine**: Swine vesicular disease, vesicular exanthema, Seneca Valley virus
- **Samples**: Vesicular fluid and epithelium, sent to specialized OIE FMD reference laboratories for real-time PCR, antigen ELISAs, or virus isolation.

#### **Prevention in animals**:
- **Control Methods**: Biosecurity measures, including controlling access to livestock, regular cleaning, monitoring illness. Culling infected animals, controlling movement, disinfecting premises, and setting up vaccination buffer zones are key strategies. Vaccination should aim for 80% coverage using strain-matched vaccines.
- **Vaccines**: Help protect against illness but may not prevent carrier status.

#### **Treatment in animals**:
No specific treatment; only supportive care is available.

#### **Impact on humans**: 
This virus does not infect humans but poses a significant threat to livestock populations and the agricultural economy.

#### **Link to more**:
[General FMD Info](https://www.woah.org/en/disease/foot-and-mouth-disease/) | [FMD in Kenya](https://www.sciencedirect.com/science/article/abs/pii/S0167587721000593) and [here](https://pubmed.ncbi.nlm.nih.gov/34339447/)
""",
    'lump': """
## Lumpy Skin Disease (LSD)

#### **Key Words**: 
- OIE List A Notifiable
- Firm and painful nodules in bovine

#### **Disease**: 
Lumpy Skin Disease is caused by an enveloped DNA virus (Family: *Poxviridae*; Genus: *Capripoxvirus*).

#### **Animals Affected**: 
Bovine (*Bos indicus* and *B. taurus*) and Water Buffalo are the animals affected.

#### **Transmission in animals**:
- **Direct transmission**: Occurs when a healthy animal comes into contact with an infected animal’s bodily fluids (e.g., saliva or semen), though this plays a minor role in overall virus transmission.
- **Indirect transmission**: Arthropod vectors are the main source of transmission, including species of mosquitoes, biting flies, and ticks. Incidence is highest during wet summer weather along watercourses and in low-lying areas.

#### **Clinical signs in animals**:
- The characteristic clinical sign is the appearance of well-circumscribed, firm, and painful nodules on the skin and mucous membranes, especially on the head, neck, limbs, and udder. 
- Over time, these nodules may either regress or develop into hard, raised areas, which eventually slough off, leaving ulcers that heal and scar. 
- Secondary infections and necrosis of the nodules may occur. Other clinical signs include fever (up to 41°C), reduced milk yield, depression, inappetence, rhinitis, conjunctivitis, swollen lymph nodes, and extensive edema.

#### **Diagnosis in animals**:
- **Differential Diagnosis**: Pseudocowpox, bovine herpesvirus, insect bite hypersensitivity, dermatophilosis, and bovine papillomatosis.
- **Samples**: Skin nodules, biopsies, blood samples, and scabs. PCR tests, ELISAs, and virus isolation methods are used for diagnosis.

#### **Prevention in animals**:
- **Vaccines**: Live attenuated vaccines provide effective protection against LSD. However, mass vaccination campaigns must reach a high percentage of the population for effective disease control.
- **Control Methods**: Vector control through insect repellents and movement restrictions in infected areas. Culling of infected animals may be necessary in severe outbreaks.

#### **Treatment in animals**:
- There is no specific treatment for LSD. Supportive care is provided to prevent secondary infections (e.g., antibiotics for bacterial infections), and anti-inflammatory medications may be used to relieve pain and fever.

#### **Impact on humans**: 
This virus does not infect humans. However, the disease significantly threatens animal populations and the farming economy.

#### **Link to more**:
[General LSD Info](https://www.woah.org/en/disease/lumpy-skin-disease/) | [LSD in Kenya](https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2020.00259/full)
""",
    'ncd': """
## Newcastle Disease (NCD)
#### **Key Words**: 
- OIE List A Notifiable
- Respiratory distress and neurologic signs in chickens
- Potential for 100% morbidity/mortality

#### **Disease**: 
Newcastle Disease is a negative sense, single-stranded, enveloped RNA virus (Family: Paramyxoviridae; Genus: Avulavirus). There are 5 pathotypes based on clinical signs - viscerotropic velogenic, neurotropic velogenic, mesogenic, lentogenic or respiratory, and asymptomatic. 
#### **Animals Affected**: 
Domestic poultry and other bird species are affected; chickens are highly susceptible to the disease. 

#### **Transmission in animals**: 
**Direct Transmission**: is the main source of transmission. This occurs through direct contact with secretions from infected birds, mainly via ingestion of contaminated water or food (fecal/oral route) and inhalation. 
**Indirect Transmission**: occurs through fomites (i.e. feed, water, implements, premises, human clothing, boots, sacks, egg trays/crates, etc). 

#### **Clinical signs in animals:**
**Velogenic Strains:** cause symptoms like lethargy, watery greenish diarrhea, twisted necks (torticollis), opisthotonus, dyspnea (a whistling sound can be appreciated), and interrupted egg production (appear misshapen and abnormally colored). In naive flocks, morbidity and mortality can reach up to 100%; survivors may show neurologic signs, reduced egg production, and abnormal eggs, while well-vaccinated birds may remain asymptomatic but still shed the virus. Additionally, velogenic strains cause petechiae hemorrhage, and necrosis in various organs, such as the intestine, spleen, thymus, and lungs. 
**Neurotropic Strains:** cause respiratory distress (sneezing, coughing, nasal discharge) followed by neurologic symptoms such as tremors, convulsions, torticollis, and paralysis, with morbidity reaching up to 100% and mortality as high as 50%, or 90% in young birds.
**Mesogenic Strains:** cause acute respiratory distress (sneezing, coughing, nasal discharge) and neurologic signs; however, mortality rate is usually low (<10%). 

#### **Diagnosis in animals:**
**Differential Diagnoses**: Infectious bronchitis, highly pathogenic avian influenza, infectious laryngotracheitis, avian metapneumovirus, infectious coryza, mycoplasmosis, fowl cholera, and aspergillosis
Samples from recently deceased birds include oro-nasal swabs and tissues like the lungs, kidneys, and spleen, while live moribund birds require tracheal, oropharyngeal, and cloacal swabs; serology requires clotted blood or serum. Laboratory confirmation of Newcastle disease involves virus isolation from swabs or tissues, with real-time RT-PCR for viral RNA detection and differentiation between vNDV and loNDV. Serological tests like hemagglutination inhibition or ELISA, along with molecular methods like sequencing and the intracerebral pathogenicity index, help confirm infection and assess the virus’s origin and pathogenicity.

#### **Prevention in animals:**
- Strict biosecurity, including quarantine, disinfection, and control of movement, is essential to prevent vNDV introduction and transmission in poultry. In the event of an outbreak, culling infected birds, cleaning premises, and enforcing a 21-day waiting period before restocking are key measures, along with notifying authorities and following regulations on bird imports. The virus is inactivated by formalin, phenolics, chlorhexidine, and sodium hypochlorite. 
- In Kenya, the AVIVAX-I-2 live virus vaccine for Newcastle disease is administered by placing one drop in the chicken's eye, with protection developing in 7-14 days and requiring re-vaccination every 4 months. While vaccines help reduce losses, they do not provide complete immunity, and concurrent infections or environmental factors can affect the immune response, making proper vaccination strategies essential for effective control.

#### **Treatment in animals:**
- There is no specific treatment, only supportive care. 

#### **Impact on Humans**
The virus can cause conjunctivitis in humans, mainly in laboratory workers, but has not been reported in poultry workers or consumers; however, it poses a significant threat to animal populations and the farming economy.

#### **Link to more:**
General: https://www.woah.org/en/disease/newcastle-disease/ | Kenya: https://pmc.ncbi.nlm.nih.gov/articles/PMC7039849/; https://www.kalro.org/navcdp/docs/livestock/CONTROL%20NEWCASTLE%20DISEASE%20USING%20AVIVAX%20-I-2.pdf
""",
    'ppr': """
## Peste des Petit Ruminants (PPR)/ Small ruminant morbillivirus (SRM)

#### **Key Words:**
- OIE List A Notifiable
- Crusting scabs along the lips of goats and sheep with bronchopneumonia  

#### **Disease:**
Peste des Petit Ruminants is a negative sense, single-stranded, enveloped RNA virus (Family: Paramyxoviridae; Genus: Morbillivirus). 

#### **Animals Affected:**Goats and sheep are the domestic animals affected. 

#### **Transmission in animals:**
**Direct Transmission:** is the main source and occurs through close contact between animals or via aerosols from secretions like tears, nasal discharge, or coughs.
**Indirect Transmission:** occurs via fomites such as contaminated bedding, feed, or water troughs, which may spread the virus between animals.
Outbreaks are more frequent during the rainy season or the dry cold season and are associated with periods of increased local movement of animals. 

#### **Clinical Signs in animals:** 
- PPR is characterized by a sudden fever (up to 41°C), a dull coat, and nasal discharge that progresses from serous to mucopurulent, diarrhea, and abortion in pregnant animals. PPR lesions are characterized by conjunctivitis, and necrotic stomatitis, with severe cases showing erosions in the mouth, pharynx, and intestines, along with bronchopneumonia. Mortality rates can reach 80-100% in outbreaks, with young animals being more susceptible. Recovery leads to lifelong immunity in sheep and goats. 

#### **Diagnosis in animals:**
**Differential Diagnosis:** 
- Contagious caprine pleuropneumonia, bluetongue, pasteurellosis (which can occur as a secondary infection to PPR), contagious ecthyma, foot and mouth disease, heartwater, coccidiosis, Nairobi sheep disease, mineral poisoning.

- Sample swabs from live animals can be taken from the conjunctiva, nasal, and buccal mucosa along with whole blood in an EDTA tube. Post-mortem samples include tissues such as lymph nodes, spleen, lung, and small intestine, particularly the mucosae and Peyer’s patches. 
- The preferred methods for identifying PPR include reverse-transcription PCR (RT-PCR) for nucleic acid detection, which is highly sensitive and rapid, and immunocapture ELISA for antigen detection, which allows for rapid diagnosis. Virus isolation remains definitive but labor-intensive, and antibody detection through ELISA or virus neutralization is recommended for epidemiological surveillance. 

#### **Prevention:**
- In endemic areas, vaccination is key to control as international organizations are aiming for global eradication by 2030. In Kenya, the Pestevax vaccine is a live attenuated PPR virus vaccine that provides protection from natural disease for over a year. Additionally, biosecurity is important in minimizing spread, and infected animals should be slaughtered and their carcasses burned or deeply buried.

#### **Treatment in animals:**  
There is no specific treatment, only supportive care. 

#### **Impact on humans:** 
- This virus does not infect humans. However, the disease significantly threatens animal populations and the farming economy. 
#### **Link to more:**
- General: https://www.woah.org/en/disease/peste-des-petits-ruminants/ | Kenya: https://ruforum.org/sites/default/files/Kihu,%20S.M.%20et%20al..pdf
""",
    'rab': """
## Rabies
#### **Keywords:** 
- Zoonotic
- Canine reservoir host
- Acute behavioral changes
- unexpected progressive paralysis 

#### **Disease:** 
Rabies is a negative sense, single-stranded, enveloped RNA virus (Family: Rhabdoviridae; Genus: Lyssavirus). 

#### **Animals affected:** 
All warm-blooded animals can be infected by the virus. Of public health importance, dogs and bats are responsible for virus transmission to humans, with wildlife acting as key reservoirs for cross-species transmission.

#### **Transmission in animals:**
**Direct Transmission** is the predominant way the virus is spread, specifically via bites or scratches from an infected animal, which introduce the virus through saliva. Infected saliva can also enter open wounds or mucous membranes (like the eyes or mouth). 

#### **Clinical signs in animals:**
- The clinical course of rabies progresses from the prodromal to acute excitative and paralytic phases, with death occurring shortly after paralysis. However, these phases have limited practical value due to variable clinical signs and durations.
- The furious form of rabies is marked by aggression, often leading animals to attack others, along with signs like dilated pupils, excessive roaming, and swallowing foreign objects. The disease progresses to muscular incoordination, seizures, and death from paralysis.
- The paralytic form of rabies is marked by ataxia and paralysis of the throat and masseter muscles, which causes profuse salivation and difficulty swallowing. As paralysis rapidly spreads, coma and death occur within hours. 
- Rabies should be suspected in wildlife acting abnormally, such as showing no fear of humans, being active during the day, or exhibiting paralysis.

#### **Diagnosis in animals:**
- No definitive antemortem test exists; euthanasia should be performed carefully to preserve the brain and brainstem for refrigeration and testing.
- The virus can be confirmed post-mortem via either immunofluorescence microscopy on fresh brain tissue or molecular testing. 

#### **Prevention in animals:**
- Mass vaccinations are the most effective prevention measure. In Kenya, cats and dogs should be vaccinated annually. 
- Measures to prevent rabies spread include housing pets and livestock away from wild animals, neutering to prevent roaming and controlling strays. The virus is inactivated by disinfectants like formalin, alcohol, and phenol, and is highly sensitive to heat and ultraviolet light.

#### **Treatment in animals:**  
There is no specific treatment for animals.

#### **Impact on animals:** 
- Rabies is zoonotic and has the highest case fatality rate of any infectious disease. In Kenya, an estimated 2,000 people die annually from rabid dog bites.
 Pre-exposure immunization is recommended for high-risk groups, including veterinary staff and animal control officers; the primary series is given on days 0 and 7, with booster doses every three years.
- If bitten by a dog, regardless of vaccination status, wash the wound thoroughly with soap and water or antiseptics for at least 15 minutes and seek post-exposure vaccination within 8 hours.

#### **Link to more:**
- General: https://www.woah.org/en/disease/rabies/ 
- Kenya: http://guidelines.health.go.ke:8000/media/Strategic_plan_for_elimination_of_Rabies.pdf; https://pmc.ncbi.nlm.nih.gov/articles/PMC8960031/ ; https://www.kalro.org/navcdp/docs/livestock/RABIES.%20%20PREVENTION%20AND%20CONTROL.pdf
""",

    'rvf': """
## Rift Valley Fever (RVF)
#### **Keywords:**
- OIE List A Notifiable 
- Zoonotic
- Abortion and neonatal mortality associated with heavy rainfall

#### **Disease:** 
- Rift Valley Fever is an enveloped negative-sense, tri-segmented RNA virus (Family: Phenuiviridae; Genus: Phlebovirus). 
#### **Animals affected:** 
- Cattle, sheep, and goats are the primary domestic animals affected.
#### **Transmission in animals:**
- **Direct Transmission:** occurs when a healthy animal encounters an infected animal and/or their bodily fluids (nasal discharge, blood, vaginal secretions after abortion).
- **Indirect Transmission:** Arthropod vectors are the main source of transmission, including species of mosquitoes and biting flies. Additionally, the reuse of needles after infected animals can transmit the virus. 
- RVF incidence peaks during the late rainy season, with outbreaks linked to heavy rains, flooding, or irrigation schemes.

#### **Clinical signs in animals:**
- Rift Valley fever (RVF) presents with nonspecific clinical signs (fever, weakness, listlessness, and abortions) and high mortality in young animals. 
- **Small Ruminants:** Lambs and kids are extremely susceptible (up to 70% mortality), with peracute death, biphasic fever (up to 42°C), bloody diarrhea, and dyspnea. Adult sheep are highly susceptible (up to 70% mortality), showing fever, respiratory distress, and abortion storms, which can reach 100%. Adult goats are moderately susceptible, with less severe signs than sheep.
- **Bovine:** Calves show high susceptibility (mortality as high as 70%) with biphasic fever (up to 41°C), bloody diarrhea, and icterus. Adult cattle are moderately susceptible with a fever, dull coat, excessive salivation/nasal discharge, decreased milk yield, and abortions in pregnant cows. 

#### **Diagnosis in animals:**
- Differential Diagnosis: Bluetongue, Wesselsbron disease, enterotoxemia of sheep, ephemeral fever, brucellosis, vibriosis, trichomonosis, Nairobi sheep disease, heartwater, ovine enzootic abortion, toxic plants, bacterial septicaemia, rinderpest, Peste des petits ruminants, and anthrax.
At necropsy: characteristic histologic lesions in liver specimens with the most severe in aborted fetuses and newborn lambs. 
- Samples to collect for RVF diagnosis include heparinized or clotted blood, plasma or serum, and tissue samples from the liver, spleen, kidneys, lymph nodes, heart blood, and brain of dead animals or aborted fetuses. Virus identification can be done via PCR, virus isolation in cell cultures, or antigen detection using ELISA. Histopathology and immunohistochemistry of liver tissue can confirm RVF infection, while serological tests like ELISA and virus neutralization help detect antibodies and confirm recent infections.

#### **Prevention in animals:**
- Proactive measures, such as forecasting precipitation and monitoring vector populations, can help prevent outbreaks. Control measures for RVF include restricting animal movements, managing slaughterhouse exposure, and draining standing water to reduce mosquito vectors, such as dambos. 
- In Kenya, RIFTVAX™ is a live attenuated RVF vaccine that provides three years of immunity with one inoculation, but should not be given to pregnant animals due to risks of abortion and fetal abnormalities. Routine vaccination of lambs at six months and vaccinating offspring of susceptible ewes can help protect against RVF.
- During outbreaks, focus should be on coordinating efforts for human and animal health, educating personnel, recognizing that efforts to mitigate its course, such as confinement of livestock and control of vectors, is often impractical. The virus is inactivated by lipid solvents (i.e. chloroform, sodium deoxycholate, low concentrations of formalin). 
Treatment in animals: There is no specific treatment. 

#### **Impact on humans:**
- Rift Valley Fever (RVF) is a zoonotic disease transmitted through contact with infected animal tissues, bodily fluids, or mosquito bites, especially in high-risk occupations like farming, herding, and veterinary work. Symptoms include fever (up to 40°C), muscle pain, headache, and weakness, with most cases resolving in 4-7 days.
- However, severe cases can cause ocular issues, meningoencephalitis, or hemorrhagic fever, which has a fatality rate of around 50%. Treatment for humans is mainly supportive care, although severe cases may require intensive care. Prevention of animal infection through vaccination and control measures is the best protective measure for humans.

#### **Link to more:**
General: https://www.woah.org/en/disease/rift-valley-fever/ 
 | Kenya: https://kevevapi.or.ke/riftvax/; https://www.who.int/emergencies/disease-outbreak-news/item/2021-DON311; https://pmc.ncbi.nlm.nih.gov/articles/PMC2367216/
""",
    'gp': """
## Goat Pox
#### **Keywords:**  
- OIE List A Notifiable
- Skin lesions 

#### **Diseases:** 
Goat Pox is an enveloped DNA virus (Family: Poxviridae; Genus: Capripoxvirus). It is related to Sheep Pox and Lumpy Skin Disease. 

#### **Animals affected:** 
Most strains of the virus exclusively affect goats; although there are some strains that can also affect sheep. 

#### **Transmission in animals:**
- **Direct transmission:** is the main transmission method and occurs through aerosol exposure after close contact with severely affected animals that have ulcerated papules on their mucous membranes. Animals with mild infections rarely transmit disease. 
- **Indirect transmission:**occurs through contaminated fomites (i.e. tools, vehicles, or litter). Insects acting as mechanical vectors play a minor role in transmission. 

#### **Clinical signs in animals:**
- Early clinical signs include fever above 40°C, the development of small, circumscribed hyperemic areas (macules), which develop into hard swellings (papules).
- The acute phase occurs within 24 hours of generalized papules. Animals develop rhinitis, conjunctivitis, and enlarged superficial lymph nodes, which can compromise the respiratory tract, causing dyspnea. Papules on the eyelids cause blepharitis, while papules on mucous membranes ulcerate, creating mucopurulent discharge. 
- If the animal survives the acute phase, the papules necrose, scab, and scar. Secondary pneumonia and fly strike are common complications.

#### **Diagnosis in animals:**
- **Differential Diagnoses:** The clinical signs of severe sheep pox and goat pox are distinctive but can be mistaken for contagious ecthyma, insect bites, bluetongue, peste des petits ruminants, photosensitization, dermatophilosis, parasitic pneumonia, caseous lymphadenitis, and mange in their mild form.
- Live animal samples include skin biopsies, vesicular fluid, scabs, scrapings, lymph node aspirates, whole blood, and paired sera; necropsy samples include skin, lymph nodes, lung lesions, and other affected tissues for histology. The virus can be identified through genome detection via PCR targeting the attachment protein gene, electron microscopy, virus isolation in cell culture, or antigen detection techniques. Serological tests like virus neutralization, AGID, Western blotting, and ELISA (using P32 antigen) are used for diagnosis, though some cross-react with other poxviruses and vary in sensitivity.

#### **Prevention in animals:**
- In Kenya, vaccination with S&G VAX TM, a live attenuated vaccine derived from the 0240 Kenya strain of capripox virus, is the primary method for controlling sheep and goat pox. Other preventative measures include isolation of infected animals, strict biosecurity measures, and controlling animal and vehicle movements within affected areas. The virus can be inactivated by phenol (2%) in 15 minutes, as well as by detergents, ether, chloroform, formalin, sodium hypochlorite, iodine compounds, Virkon®, and quaternary ammonium compounds.
- If culling is not feasible, infected herds should be isolated for at least 45 days, with proper disposal of cadavers, stringent cleaning and disinfection, quarantine of new animals, and movement controls for animals and vehicles.

#### **Treatment in animals:**
There is no specific treatment.

#### **Impact on humans:** 
This virus does not infect humans. However, the disease significantly threatens animal populations and the farming economy. 

#### **Link to more:**
General: https://www.woah.org/en/disease/sheep-pox-and-goat-pox/
 | Kenya: https://pmc.ncbi.nlm.nih.gov/articles/PMC2129627/#:~:text=The%20sheep%20and%20goat%20pox,field%20outbreaks%20in%20mixed%20flocks.; https://kevevapi.or.ke/sg-vax/
""",

'anthrax': """
## Anthrax
#### **Keywords:** 
- Acute death
- Uncoagulated blood from carcasses

#### **Disease:**
Anthrax is a spore-forming, gram-positive bacterium, Bacillus anthracis. The vegetative form of B. anthracis is fragile and easily inactivated, while the spore form is highly resistant to adverse conditions and can survive for years in the environment. 
Animals Affected: Herbivores (cattle, sheep, goats, camels) are the most commonly affected, but all mammals have the potential to be infected by Anthrax. 

#### **Transmission in animals:**
- **Direct Transmission** from infected animal to healthy animal is minimal.
- **Indirect Transmission:** occurs when animals ingest spores from contaminated soil, plants, or water, or inhale spores while grazing. Additionally, other indirect sources of transmission include mechanical vectors like biting flies, contaminated feed, or animal products from infected animals.

#### **Clinical signs in animals:** 
- The peracute form is marked by sudden onset, rapid deterioration, and death within a brief period, often with symptoms like staggering, dyspnea, trembling, and convulsions.
- The acute form is marked by fever (up to 41.5°C) and excitement followed by lethargy, respiratory distress, bloody discharges, and localized edema, particularly around the neck and thorax. 
- Characteristically in carcasses, rigor mortis is often absent or incomplete, with dark uncoagulated blood oozing from natural openings. Additionally, there is often marked bloating, rapid decomposition, and septicemic lesions, including hemorrhages on serosal surfaces, the epicardium, endocardium, and GI tract mucosa.

#### **Diagnosis in animals**
- Differential Diagnoses in Ruminants: Clostridial infections, bloat, lightning strike, acute leptospirosis, Anaplasmosis, acute toxicity.
- **Differential Diagnes in Equine:** acute infectious anemia, purpura, colic.
- **Differential Diagnosis in Swine:** African swine fever, pharyngeal edema.
- **Differential Diagnoses in Canines:** Acute systemic infections, pharyngeal edema.
B. anthracis, a level 3 pathogen, requires proper biocontainment and trained personnel for laboratory confirmation. Careful sample collection and packaging is critical to avoid environmental contamination and human exposure. Anthrax diagnosis involves microscopy, culture, PCR, immunohistochemistry, and the Ascoli test to detect B. anthracis in blood or tissue.

#### **Prevention in animals:**
- In Kenya, vaccination with Blanthax® or Bivax® is recommended for active immunization against anthrax in cattle, sheep, goats, horses, and camels. Vaccination should be done at least 2–4 weeks before the expected outbreak season, and antimicrobials should not be administered within 1 week of vaccination due to the use of a live attenuated spore vaccine. Annual vaccination for three consecutive years after an outbreak is advised to break the infection cycle in affected areas.
- General preventative measures include notifying authorities immediately upon sudden deaths, isolating sick animals, and disinfecting contaminated materials with formaldehyde, which can decontaminate soils if applied properly. Additionally, carcasses should be promptly disposed of by cremation or deep burial, and movement restrictions should be enforced to prevent further spread of the disease. 

#### **Treatment in animals:**
Animals at risk should be treated immediately with a long-acting antimicrobial, such as penicillin or oxytetracycline, followed by vaccination 7–10 days later. If any animals become sick after initial treatment or vaccination, they should be retreated and revaccinated a month later. 

#### **Impact on humans:**
- Anthrax is the highest ranked priority zoonotic disease in Kenya. Clinical signs vary depending on the form. Cutaneous anthrax, the most common and mild form, enters through the skin via cuts or sores and causes a raised, itchy bump that turns into a painless sore with a black center, along with possible swelling and flu-like symptoms. 
- **Gastrointestinal anthrax**, caused by eating undercooked meat from infected animals, affects the digestive tract and causes symptoms like nausea, vomiting, abdominal pain, fever, sore throat, and severe diarrhea.
- **Inhalation anthrax**, the most deadly form, occurs when anthrax spores are inhaled and causes flu-like symptoms, chest discomfort, shortness of breath, fever, and can lead to shock and meningitis. Early diagnosis and treatment with penicillin for 3-7 days are crucial, and severe cases require hospitalization with supportive care.

#### **Link to more:**
General: https://www.woah.org/en/disease/anthrax/ | Kenya: https://www.nature.com/articles/s41598-022-24000-3; http://guidelines.health.go.ke:8000/media/Anthrax-Control-Strategy_Kenya_2021-2036.pdf
"""
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/updates')
def updates():
    """
    Get unique years
    """
    allSurve['Report_Date'] = pd.to_datetime(allSurve['Report_Date'])
    years = sorted(allSurve['Report_Date'].dt.strftime('%Y').unique())
    return render_template('updates.html', years=years)

@app.route('/get_months', methods=['POST'])
def get_months():
    year = request.form['year']
    year_dates = allSurve[allSurve['Report_Date'].dt.strftime('%Y') == year]['Report_Date']
    months = sorted(year_dates.dt.strftime('%B').unique(), key=lambda x: datetime.strptime(x, '%B').month)
    return jsonify(months)

@app.route('/get_disease_data', methods=['POST'])
def get_disease_data():
    year = request.form['year']
    month = request.form['month']
    df = allSurve[allSurve['Report_Date'].dt.strftime('%Y') == year]
    df = df[df['Report_Date'].dt.strftime('%B') == month]
    highburden = df.groupby(['Disease_Condition', 'Species_Affected'])['Number_Sick'].sum().reset_index()
    highburden = highburden.sort_values('Number_Sick', ascending=False).head(10)
    data = [
        {'y': row['Number_Sick'], 'Species_Affected': row['Species_Affected'], 'category': row['Disease_Condition']}
        for _, row in highburden.iterrows()
    ]
    return jsonify({'categories': highburden['Disease_Condition'].tolist(), 'data': data})

@app.route('/get_map_data', methods=['POST'])
def get_map_data():
    year = request.form['year']
    month = request.form['month']
    disease = request.form['disease']
    df = allSurve[allSurve['Report_Date'].dt.strftime('%Y') == year]
    df = df[df['Report_Date'].dt.strftime('%B') == month]
    df = df[df['Disease_Condition'] == disease]
    map_data = df.groupby('county')['Number_Sick'].sum().reset_index()
    map_data = map_data.rename(columns={'Number_Sick': 'value'})
    return jsonify({
        'data': map_data.to_dict(orient='records'),
        'shapefile': shapefile_json
    })

@app.route('/get_kpi_data', methods=['POST'])
def get_kpi_data():
    year = request.form['year']
    month = request.form['month']
    df = allSurve[allSurve['Report_Date'].dt.strftime('%Y') == year]
    df = df[df['Report_Date'].dt.strftime('%B') == month]
    
    if df.empty:
        return jsonify({
            'top_disease': 'N/A',
            'top_county': 'N/A',
            'top_species': 'N/A',
            'total_sick': 0,
            'total_dead': 0,
            'total_at_risk': 0
        })

    # Find top disease by total sick animals
    top_disease = df.groupby('Disease_Condition')['Number_Sick'].sum().idxmax()
    
    # Filter by top disease to find top county
    df_disease = df[df['Disease_Condition'] == top_disease]
    top_county = df_disease.groupby('county')['Number_Sick'].sum().idxmax() if not df_disease.empty else 'N/A'
    
    # Filter by top disease and top county for other metrics
    df_filtered = df_disease[df_disease['county'] == top_county]
    
    # Find top species by sick animals for the top disease
    top_species = df_disease.groupby('Species_Affected')['Number_Sick'].sum().idxmax() if not df_disease.empty else 'N/A'
    
    # Calculate totals for the top disease in the top county
    total_sick = int(df_filtered['Number_Sick'].sum()) if not df_filtered.empty else 0
    total_dead = int(df_filtered['Number_Dead'].sum()) if not df_filtered.empty else 0
    total_at_risk = int(df_filtered['Number_at_Risk'].sum()) if not df_filtered.empty else 0
    
    return jsonify({
        'top_disease': top_disease,
        'top_county': top_county,
        'top_species': top_species,
        'total_sick': total_sick,
        'total_dead': total_dead,
        'total_at_risk': total_at_risk
    })

"""
National surveillance Routes 
"""
@app.route('/get_national_init', methods=['GET'])
def get_national_init():
    diseases = sorted(allSurve['Disease_Condition'].dropna().unique())
    min_date = allSurve['Report_Date'].min().strftime('%Y-%m-%d')
    max_date = allSurve['Report_Date'].max().strftime('%Y-%m-%d')
    return jsonify({
        'diseases': diseases,
        'min_date': min_date,
        'max_date': max_date
    })

@app.route('/get_counties', methods=['POST'])
def get_counties():
    disease = request.form['disease']
    df = allSurve[allSurve['Disease_Condition'] == disease]
    counties = sorted(df['county'].unique())
    if not counties:
        counties = sorted(allSurve['county'].unique())
    return jsonify(counties)

@app.route('/get_national_map_data', methods=['POST'])
def get_national_map_data():
    disease = request.form['disease']

    """
    Filter data based on diseases
    """
    df = allSurve[(allSurve['Disease_Condition'] == disease) ]

    grouped_data = df.groupby(['county', 'Disease_Condition'])['Number_Sick'].sum().reset_index()

    # Filter county shapefile for the selected disease
    map_data = grouped_data.groupby('county')['Number_Sick'].sum().reset_index()
    map_data = map_data.rename(columns={'Number_Sick': 'value'})
    return jsonify({
        'data': map_data.to_dict(orient='records'),
        'shapefile': shapefile_json,
        'grouped_details': grouped_data.to_dict(orient='records')
    })

@app.route('/get_county_map_data', methods=['POST'])
def get_county_map_data():
    disease = request.form['disease']
    county = request.form['county']
    
    """
    Filter data based on county and disease, then aggregate by sub_county
    """
    df = allSurve[
        (allSurve['Disease_Condition'] == disease) &
        (allSurve['county'] == county)
    ]
    map_data = df.groupby('sub_county')['Number_Sick'].sum().reset_index()
    map_data = map_data.rename(columns={'Number_Sick': 'value'})

     # Debug logging
    print(f"County map data for {disease} in {county}:", map_data.to_dict(orient='records'))
   
    # Filter subcounty shapefile for the selected county
    subcounty_shapefile_filtered = sub_shapefile[sub_shapefile['county'] == county]
    subcounty_shapefile_json = json.loads(subcounty_shapefile_filtered.to_json())
    print(f"Subcounty shapefile for {county}:", subcounty_shapefile_filtered['sub_county'].tolist())
    
    return jsonify({
        'data': map_data.to_dict(orient='records'),
        'shapefile': subcounty_shapefile_json
    })

@app.route('/animal-surveillance/<section>')
def animal_surveillance(section):
    valid_sections = ['national', 'county', 'disease','population']
    if section not in valid_sections:
        section = 'national'
    if section == 'population':
        species = sorted(allPopulation['Species'].unique())
        return render_template('animal_surveillance.html', section=section, species=species)
    if section == 'county':
        counties = sorted(allSurve['county'].unique())
        diseases = sorted(allSurve['Disease_Condition'].dropna().unique())
        return render_template('animal_surveillance.html', section=section, counties=counties, diseases=diseases)
    return render_template('animal_surveillance.html', section=section)

"""
County statistics
"""
@app.route('/get_county_surveillance_data', methods=['POST'])
def get_county_surveillance_data():
    county = request.form.get('county')
    subcounty = request.form.get('subcounty')
    disease = request.form.get('disease')
    clicked_disease = request.form.get('clicked_disease')

    # Validate inputs
    if county not in allSurve['county'].unique():
        return jsonify({'error': 'Invalid county'}), 400
    if subcounty and subcounty not in allSurve[allSurve['county'] == county]['sub_county'].unique():
        return jsonify({'error': 'Invalid subcounty'}), 400
    if disease and disease not in allSurve['Disease_Condition'].unique():
        return jsonify({'error': 'Invalid disease'}), 400

    # Subcounty list for dropdown
    subcounties = sorted(allSurve[allSurve['county'] == county]['sub_county'].unique())

    # County map data (subcounty-level)
    county_data = allSurve[allSurve['county'] == county]
    if disease:
        county_data = county_data[county_data['Disease_Condition'] == disease]
    county_map_data = county_data.groupby(['county', 'sub_county', 'Disease_Condition', 'Species_Affected'])['Number_Sick'].sum().reset_index()
    county_map_data = county_map_data.rename(columns={'Number_Sick': 'value'})

    # Subcounty map data (ward-level)
    subcounty_data = allSurve[(allSurve['county'] == county) & (allSurve['sub_county'] == subcounty)]
    if disease:
        subcounty_data = subcounty_data[subcounty_data['Disease_Condition'] == disease]
    subcounty_map_data = subcounty_data.groupby(['Ward', 'sub_county', 'Disease_Condition', 'Species_Affected'])['Number_Sick'].sum().reset_index()
    subcounty_map_data = subcounty_map_data.rename(columns={'Number_Sick': 'value'})

    # Priority diseases bar plot data (top 10)
    priority_data = allSurve[allSurve['county'] == county].groupby(['county', 'Disease_Condition'])['Number_Sick'].sum().reset_index()
    priority_data = priority_data.rename(columns={'Number_Sick': 'value'})
    priority_data = priority_data.sort_values('value', ascending=False).head(10)
  

    # Trend data (for clicked disease)
    trend_data = allSurve[allSurve['Disease_Condition'] == clicked_disease] if clicked_disease else pd.DataFrame()
    if not trend_data.empty:
        trend_data = trend_data.groupby(['Disease_Condition', 'Report_Date', 'Species_Affected'])['Number_Sick'].sum().reset_index()
        trend_data['Month'] = pd.to_datetime(trend_data['Report_Date']).dt.strftime('%Y-%m')
        trend_data = trend_data.rename(columns={'Number_Sick': 'value'})
      
        trend_data = trend_data.groupby(['Species_Affected', 'Month'])['value'].sum().reset_index()
        trend_data = trend_data.sort_values('Month')

    # Shapefiles
    # Filter shapefiles to match R logic
    county_shapefile = {
        "type": "FeatureCollection",
        "features": [f for f in sub_shapefile_json.get('features', []) if f.get('properties', {}).get('county') == county]
    }
    ward_shapefile = {
        "type": "FeatureCollection",
        "features": [f for f in ward_shapefile_json.get('features', []) if f.get('properties', {}).get('county') == county and f.get('properties', {}).get('sub_county') == subcounty]
    }


    # Debug shapefile properties
    print(f"County shapefile properties for {county}:", [f['properties'] for f in county_shapefile['features'][:2]])
    print(f"Ward shapefile properties for {county}/{subcounty}:", [f['properties'] for f in ward_shapefile['features'][:2]])

    print(f"County surveillance data for {county}, {subcounty}, {disease}, {clicked_disease}:", {
        'county_map_data': county_map_data.to_dict(orient='records')[:2],
        'subcounty_map_data': subcounty_map_data.to_dict(orient='records')[:2],
        'priority_data': priority_data.to_dict(orient='records')[:2],
        'trend_data': trend_data.to_dict(orient='records')[:2],
    })

    return jsonify({
        'subcounties': subcounties,
        'county_map_data': county_map_data.to_dict(orient='records'),
        'subcounty_map_data': subcounty_map_data.to_dict(orient='records'),
        'priority_data': {
            'diseases': priority_data['Disease_Condition'].tolist(),
            'values': priority_data['value'].tolist()
        },
        'trend_data': {
            'species': trend_data['Species_Affected'].tolist() if not trend_data.empty else [],
            'months': trend_data['Month'].tolist() if not trend_data.empty else [],
            'values': trend_data['value'].tolist() if not trend_data.empty else []
        },
        'county_shapefile': county_shapefile,
        'ward_shapefile': ward_shapefile
    })

@app.route('/get_population_data', methods=['POST'])
def get_population_data():
    species = request.form.get('species')
    
    # Validate species
    if species not in allPopulation['Species'].unique():
        return jsonify({'error': 'Invalid species'}), 400

    # Filter data by species
    df_species = allPopulation[allPopulation['Species'] == species]
    
    # Map data
    map_data = df_species.groupby('county')['value'].sum().reset_index()
    map_data = map_data.rename(columns={'value': 'value'})
    
    # Bar plot data (sorted by population descending)
    bar_data = df_species[df_species['value'] > 0].groupby('county')['value'].sum().reset_index()
    bar_data = bar_data.rename(columns={'value': 'value'}).sort_values('value', ascending=False)
    
    print(f"Population data for {species}:", {
        'map_data': map_data.to_dict(orient='records'),
        'bar_data': bar_data.to_dict(orient='records')
    })

    return jsonify({
        'map_data': {
            'data': map_data.to_dict(orient='records'),
            'shapefile': shapefile_json
        },
        'bar_data': {
            'counties': bar_data['county'].tolist(),
            'values': bar_data['value'].tolist()
        }
    })

@app.route('/priority-diseases/<disease>')
def priority_diseases(disease):
    valid_diseases = {
        'asf': 'African Swine Fever (ASF)',
        'anthrax': 'Anthrax',
        'bru': 'Brucellosis',
        'bov': 'Bovine Pleuropneumonia (CBPP)',
        'cap': 'Caprine Pleuropneumonia (CCPP)',
        'fmd': 'Foot and Mouth Disease (FMD)',
        'lump': 'Lumpy Skin Disease (LSD)',
        'ncd': 'Newcastle Disease (NCD)',
        'ppr': 'Peste des Petit Ruminants (PPR)',
        'rab': 'Rabies',
        'rvf': 'Rift Valley Fever (RVF)',
        'gp': 'Goat Pox'
    }
    if disease not in valid_diseases:
        disease = 'asf' 
    disease_name = valid_diseases[disease]
    return render_template('priority_diseases.html', disease=disease, disease_name=disease_name)

@app.route('/get_disease_visuals/<disease>', methods=['POST'])
def get_disease_visuals(disease):
    time_period = request.form.get('time_period', '1y')  
    indicator = request.form.get('indicator', 'Number_Sick')

    # Validate disease
    valid_diseases = {
        'asf': 'African Swine Fever (ASF)',
        'anthrax': 'Anthrax',
        'bru': 'Brucellosis',
        'bov': 'Contagious Bovine Pleuropneumonia (CBPP)',
        'cap': 'Contagious Caprine Pleuropneumonia (CCPP)',
        'fmd': 'Foot and Mouth Disease (FMD)',
        'lump': 'Lumpy Skin Disease (LSD)',
        'ncd': 'Newcastle Disease (NCD)',
        'ppr': 'Peste des Petit Ruminants (PPR)',
        'rab': 'Rabies',
        'rvf': 'Rift Valley Fever (RVF)',
        'gp': 'Goat Pox'
    }
    if disease not in valid_diseases:
        return jsonify({'error': 'Invalid disease'}), 400

    disease_name = valid_diseases[disease]

    # Calculate date range based on time period
    end_date = datetime(2025, 7, 21)  # Current date
    time_periods = {
        '1m': timedelta(days=30),
        '6m': timedelta(days=180),
        '9m': timedelta(days=270),
        '1y': timedelta(days=365),
        '2y': timedelta(days=730),
        '3y': timedelta(days=1095)
    }
    if time_period not in time_periods:
        time_period = '1y'  # Default to 1 year
    start_date = end_date - time_periods[time_period]
    
    # Convert to strings for filtering
    start_date_str = start_date.strftime('%Y-%m-%d')
    end_date_str = end_date.strftime('%Y-%m-%d')

    # Filter data
    df = allSurve[
        (allSurve['Disease_Condition'] == disease_name) &
        (allSurve['Report_Date'] >= start_date_str) &
        (allSurve['Report_Date'] <= end_date_str)
    ]

    # Map data
    map_data = df.groupby('county')['Number_Sick'].sum().reset_index()
    map_data = map_data.rename(columns={'Number_Sick': 'value'})

    # Trend data
    df['Month'] = df['Report_Date'].dt.to_period('M').astype(str)
    trend_data = df.groupby(['Month', 'Species_Affected'])[indicator].sum().reset_index()
    trend_series = []
    for species in trend_data['Species_Affected'].unique():
        species_data = trend_data[trend_data['Species_Affected'] == species]
        trend_series.append({
            'name': f"{species} - {indicator}",
            'data': species_data[indicator].tolist(),
            'type': 'spline'
        })

    # Table data
    table_data = df.groupby(['county', 'Month', 'Disease_Condition', 'Species_Affected'])['Number_Sick'].sum().reset_index()
    table_data = table_data.rename(columns={'Number_Sick': 'Reports'})
    table_data['Species_List'] = table_data['Species_Affected']

    # About text
    about_text = markdown2.markdown(disease_info.get(disease, 'No information available.'), extras=["fenced-code-blocks", "tables"])

    print(f"Disease visuals for {disease_name} (Period: {time_period}):", {
        'map_data': map_data.to_dict(orient='records'),
        'trend_data': {'months': trend_data['Month'].unique().tolist(), 'series': trend_series},
        'table_data': table_data.to_dict(orient='records')
    })

    return jsonify({
        'map_data': {
            'data': map_data.to_dict(orient='records'),
            'shapefile': shapefile_json
        },
        'trend_data': {
            'months': trend_data['Month'].unique().tolist(),
            'series': trend_series
        },
        'table_data': table_data.to_dict(orient='records'),
        'about_text': about_text
    })

@app.route('/vaccine-coverage')
def vaccine_coverage():
    return render_template('vaccine_coverage.html')


if __name__ == '__main__':
    app.run(debug=True)