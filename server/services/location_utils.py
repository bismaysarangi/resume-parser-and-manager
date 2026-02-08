"""
Indian City to State Mapping
Comprehensive mapping of cities, towns, and districts to their states
"""

# Comprehensive Indian city-to-state mapping
CITY_STATE_MAPPING = {
    # Odisha (Orissa)
    'bhubaneswar': 'Odisha',
    'cuttack': 'Odisha',
    'rourkela': 'Odisha',
    'berhampur': 'Odisha',
    'sambalpur': 'Odisha',
    'puri': 'Odisha',
    'balasore': 'Odisha',
    'baripada': 'Odisha',
    'bhadrak': 'Odisha',
    'jharsuguda': 'Odisha',
    'jeypore': 'Odisha',
    'kendrapara': 'Odisha',
    'rayagada': 'Odisha',
    'angul': 'Odisha',
    'koraput': 'Odisha',
    'parlakhemundi': 'Odisha',
    'sundargarh': 'Odisha',
    
    # Karnataka
    'bangalore': 'Karnataka',
    'bengaluru': 'Karnataka',
    'mysore': 'Karnataka',
    'mysuru': 'Karnataka',
    'hubli': 'Karnataka',
    'mangalore': 'Karnataka',
    'belgaum': 'Karnataka',
    'gulbarga': 'Karnataka',
    'davanagere': 'Karnataka',
    'bellary': 'Karnataka',
    'bijapur': 'Karnataka',
    'shimoga': 'Karnataka',
    'tumkur': 'Karnataka',
    'raichur': 'Karnataka',
    'bidar': 'Karnataka',
    'hospet': 'Karnataka',
    'gadag': 'Karnataka',
    'udupi': 'Karnataka',
    'hassan': 'Karnataka',
    'chitradurga': 'Karnataka',
    'mandya': 'Karnataka',
    
    # Tamil Nadu
    'chennai': 'Tamil Nadu',
    'madras': 'Tamil Nadu',
    'coimbatore': 'Tamil Nadu',
    'madurai': 'Tamil Nadu',
    'tiruchirappalli': 'Tamil Nadu',
    'trichy': 'Tamil Nadu',
    'salem': 'Tamil Nadu',
    'tirunelveli': 'Tamil Nadu',
    'tiruppur': 'Tamil Nadu',
    'erode': 'Tamil Nadu',
    'vellore': 'Tamil Nadu',
    'thoothukudi': 'Tamil Nadu',
    'dindigul': 'Tamil Nadu',
    'thanjavur': 'Tamil Nadu',
    'ranipet': 'Tamil Nadu',
    'sivakasi': 'Tamil Nadu',
    'karur': 'Tamil Nadu',
    'kanchipuram': 'Tamil Nadu',
    'kumbakonam': 'Tamil Nadu',
    'nagercoil': 'Tamil Nadu',
    'cuddalore': 'Tamil Nadu',
    
    # Maharashtra
    'mumbai': 'Maharashtra',
    'pune': 'Maharashtra',
    'nagpur': 'Maharashtra',
    'thane': 'Maharashtra',
    'nashik': 'Maharashtra',
    'aurangabad': 'Maharashtra',
    'solapur': 'Maharashtra',
    'kolhapur': 'Maharashtra',
    'amravati': 'Maharashtra',
    'navi mumbai': 'Maharashtra',
    'sangli': 'Maharashtra',
    'malegaon': 'Maharashtra',
    'jalgaon': 'Maharashtra',
    'akola': 'Maharashtra',
    'latur': 'Maharashtra',
    'ahmednagar': 'Maharashtra',
    'chandrapur': 'Maharashtra',
    'parbhani': 'Maharashtra',
    'ichalkaranji': 'Maharashtra',
    'jalna': 'Maharashtra',
    
    # Delhi
    'delhi': 'Delhi',
    'new delhi': 'Delhi',
    'north delhi': 'Delhi',
    'south delhi': 'Delhi',
    'east delhi': 'Delhi',
    'west delhi': 'Delhi',
    'central delhi': 'Delhi',
    
    # West Bengal
    'kolkata': 'West Bengal',
    'calcutta': 'West Bengal',
    'howrah': 'West Bengal',
    'durgapur': 'West Bengal',
    'asansol': 'West Bengal',
    'siliguri': 'West Bengal',
    'bardhaman': 'West Bengal',
    'english bazar': 'West Bengal',
    'kharagpur': 'West Bengal',
    'haldia': 'West Bengal',
    'krishnanagar': 'West Bengal',
    'raiganj': 'West Bengal',
    'medinipur': 'West Bengal',
    'jalpaiguri': 'West Bengal',
    
    # Gujarat
    'ahmedabad': 'Gujarat',
    'surat': 'Gujarat',
    'vadodara': 'Gujarat',
    'rajkot': 'Gujarat',
    'bhavnagar': 'Gujarat',
    'jamnagar': 'Gujarat',
    'junagadh': 'Gujarat',
    'gandhinagar': 'Gujarat',
    'gandhidham': 'Gujarat',
    'anand': 'Gujarat',
    'navsari': 'Gujarat',
    'morbi': 'Gujarat',
    'surendranagar': 'Gujarat',
    'bharuch': 'Gujarat',
    'vapi': 'Gujarat',
    
    # Telangana
    'hyderabad': 'Telangana',
    'warangal': 'Telangana',
    'nizamabad': 'Telangana',
    'karimnagar': 'Telangana',
    'ramagundam': 'Telangana',
    'khammam': 'Telangana',
    'mahbubnagar': 'Telangana',
    'nalgonda': 'Telangana',
    'adilabad': 'Telangana',
    'suryapet': 'Telangana',
    'siddipet': 'Telangana',
    'miryalaguda': 'Telangana',
    
    # Andhra Pradesh
    'visakhapatnam': 'Andhra Pradesh',
    'vijayawada': 'Andhra Pradesh',
    'guntur': 'Andhra Pradesh',
    'nellore': 'Andhra Pradesh',
    'kurnool': 'Andhra Pradesh',
    'tirupati': 'Andhra Pradesh',
    'kadapa': 'Andhra Pradesh',
    'kakinada': 'Andhra Pradesh',
    'rajahmundry': 'Andhra Pradesh',
    'anantapur': 'Andhra Pradesh',
    'eluru': 'Andhra Pradesh',
    'ongole': 'Andhra Pradesh',
    'vizianagaram': 'Andhra Pradesh',
    'machilipatnam': 'Andhra Pradesh',
    
    # Uttar Pradesh
    'lucknow': 'Uttar Pradesh',
    'kanpur': 'Uttar Pradesh',
    'ghaziabad': 'Uttar Pradesh',
    'agra': 'Uttar Pradesh',
    'meerut': 'Uttar Pradesh',
    'varanasi': 'Uttar Pradesh',
    'prayagraj': 'Uttar Pradesh',
    'allahabad': 'Uttar Pradesh',
    'bareilly': 'Uttar Pradesh',
    'aligarh': 'Uttar Pradesh',
    'moradabad': 'Uttar Pradesh',
    'saharanpur': 'Uttar Pradesh',
    'gorakhpur': 'Uttar Pradesh',
    'noida': 'Uttar Pradesh',
    'firozabad': 'Uttar Pradesh',
    'jhansi': 'Uttar Pradesh',
    'muzaffarnagar': 'Uttar Pradesh',
    'mathura': 'Uttar Pradesh',
    'rampur': 'Uttar Pradesh',
    
    # Rajasthan
    'jaipur': 'Rajasthan',
    'jodhpur': 'Rajasthan',
    'kota': 'Rajasthan',
    'bikaner': 'Rajasthan',
    'udaipur': 'Rajasthan',
    'ajmer': 'Rajasthan',
    'bhilwara': 'Rajasthan',
    'alwar': 'Rajasthan',
    'bharatpur': 'Rajasthan',
    'pali': 'Rajasthan',
    'sikar': 'Rajasthan',
    'tonk': 'Rajasthan',
    'sri ganganagar': 'Rajasthan',
    
    # Madhya Pradesh
    'indore': 'Madhya Pradesh',
    'bhopal': 'Madhya Pradesh',
    'jabalpur': 'Madhya Pradesh',
    'gwalior': 'Madhya Pradesh',
    'ujjain': 'Madhya Pradesh',
    'sagar': 'Madhya Pradesh',
    'dewas': 'Madhya Pradesh',
    'satna': 'Madhya Pradesh',
    'ratlam': 'Madhya Pradesh',
    'rewa': 'Madhya Pradesh',
    'katni': 'Madhya Pradesh',
    'singrauli': 'Madhya Pradesh',
    
    # Punjab
    'ludhiana': 'Punjab',
    'amritsar': 'Punjab',
    'jalandhar': 'Punjab',
    'patiala': 'Punjab',
    'bathinda': 'Punjab',
    'mohali': 'Punjab',
    'pathankot': 'Punjab',
    'hoshiarpur': 'Punjab',
    'batala': 'Punjab',
    'moga': 'Punjab',
    'abohar': 'Punjab',
    'malerkotla': 'Punjab',
    'khanna': 'Punjab',
    
    # Haryana
    'faridabad': 'Haryana',
    'gurgaon': 'Haryana',
    'gurugram': 'Haryana',
    'panipat': 'Haryana',
    'ambala': 'Haryana',
    'yamunanagar': 'Haryana',
    'rohtak': 'Haryana',
    'hisar': 'Haryana',
    'karnal': 'Haryana',
    'sonipat': 'Haryana',
    'panchkula': 'Haryana',
    'bhiwani': 'Haryana',
    'sirsa': 'Haryana',
    
    # Kerala
    'thiruvananthapuram': 'Kerala',
    'trivandrum': 'Kerala',
    'kochi': 'Kerala',
    'cochin': 'Kerala',
    'kozhikode': 'Kerala',
    'calicut': 'Kerala',
    'kollam': 'Kerala',
    'thrissur': 'Kerala',
    'kannur': 'Kerala',
    'alappuzha': 'Kerala',
    'kottayam': 'Kerala',
    'palakkad': 'Kerala',
    'malappuram': 'Kerala',
    
    # Bihar
    'patna': 'Bihar',
    'gaya': 'Bihar',
    'bhagalpur': 'Bihar',
    'muzaffarpur': 'Bihar',
    'purnia': 'Bihar',
    'darbhanga': 'Bihar',
    'bihar sharif': 'Bihar',
    'arrah': 'Bihar',
    'begusarai': 'Bihar',
    'katihar': 'Bihar',
    'munger': 'Bihar',
    
    # Jharkhand
    'ranchi': 'Jharkhand',
    'jamshedpur': 'Jharkhand',
    'dhanbad': 'Jharkhand',
    'bokaro': 'Jharkhand',
    'deoghar': 'Jharkhand',
    'phusro': 'Jharkhand',
    'hazaribagh': 'Jharkhand',
    'giridih': 'Jharkhand',
    
    # Chhattisgarh
    'raipur': 'Chhattisgarh',
    'bhilai': 'Chhattisgarh',
    'bilaspur': 'Chhattisgarh',
    'korba': 'Chhattisgarh',
    'durg': 'Chhattisgarh',
    'raigarh': 'Chhattisgarh',
    'rajnandgaon': 'Chhattisgarh',
    
    # Assam
    'guwahati': 'Assam',
    'silchar': 'Assam',
    'dibrugarh': 'Assam',
    'jorhat': 'Assam',
    'nagaon': 'Assam',
    'tinsukia': 'Assam',
    'tezpur': 'Assam',
    
    # Uttarakhand
    'dehradun': 'Uttarakhand',
    'haridwar': 'Uttarakhand',
    'roorkee': 'Uttarakhand',
    'haldwani': 'Uttarakhand',
    'rudrapur': 'Uttarakhand',
    'kashipur': 'Uttarakhand',
    'rishikesh': 'Uttarakhand',
    
    # Himachal Pradesh
    'shimla': 'Himachal Pradesh',
    'mandi': 'Himachal Pradesh',
    'solan': 'Himachal Pradesh',
    'nahan': 'Himachal Pradesh',
    'palampur': 'Himachal Pradesh',
    'sundernagar': 'Himachal Pradesh',
    
    # Jammu & Kashmir
    'srinagar': 'Jammu & Kashmir',
    'jammu': 'Jammu & Kashmir',
    'anantnag': 'Jammu & Kashmir',
    'baramulla': 'Jammu & Kashmir',
    'udhampur': 'Jammu & Kashmir',
    
    # Goa
    'panaji': 'Goa',
    'margao': 'Goa',
    'vasco da gama': 'Goa',
    'mapusa': 'Goa',
    'ponda': 'Goa',
    
    # Puducherry
    'puducherry': 'Puducherry',
    'pondicherry': 'Puducherry',
    'karaikal': 'Puducherry',
    
    # Chandigarh
    'chandigarh': 'Chandigarh',
}

# Alternative spellings and common variations
CITY_VARIATIONS = {
    'vizag': 'visakhapatnam',
    'vizianagaram': 'visakhapatnam',
    'bbsr': 'bhubaneswar',
    'blr': 'bangalore',
    'hyd': 'hyderabad',
    'mumbay': 'mumbai',
    'bombay': 'mumbai',
    'kochi': 'cochin',
}


def normalize_city_name(city):
    """
    Normalize city name for lookup
    """
    if not city:
        return None
    
    # Convert to lowercase and strip whitespace
    normalized = city.lower().strip()
    
    # Remove common suffixes
    normalized = normalized.replace(' city', '').replace(' town', '')
    
    # Handle variations
    if normalized in CITY_VARIATIONS:
        normalized = CITY_VARIATIONS[normalized]
    
    return normalized


def get_state_from_city(city):
    """
    Get state name from city name
    
    Args:
        city (str): City name (case-insensitive)
    
    Returns:
        str: State name or None if not found
    
    Examples:
        >>> get_state_from_city('Bhubaneswar')
        'Odisha'
        >>> get_state_from_city('cuttack')
        'Odisha'
        >>> get_state_from_city('bangalore')
        'Karnataka'
    """
    normalized = normalize_city_name(city)
    if not normalized:
        return None
    
    return CITY_STATE_MAPPING.get(normalized)


def extract_location_info(location_string):
    """
    Extract city and state from a location string
    
    Args:
        location_string (str): Location string like "Bhubaneswar, Odisha" or "Bangalore"
    
    Returns:
        dict: {'city': str, 'state': str, 'original': str}
    
    Examples:
        >>> extract_location_info('Bhubaneswar, Odisha')
        {'city': 'Bhubaneswar', 'state': 'Odisha', 'original': 'Bhubaneswar, Odisha'}
        
        >>> extract_location_info('Cuttack')
        {'city': 'Cuttack', 'state': 'Odisha', 'original': 'Cuttack'}
    """
    if not location_string:
        return {'city': None, 'state': None, 'original': None}
    
    original = location_string.strip()
    parts = [p.strip() for p in original.split(',')]
    
    # If state is already mentioned
    if len(parts) >= 2:
        city = parts[0]
        state = parts[1]
        return {
            'city': city,
            'state': state,
            'original': original
        }
    
    # Try to infer state from city
    city = parts[0]
    state = get_state_from_city(city)
    
    return {
        'city': city,
        'state': state,
        'original': original
    }


def normalize_location_for_search(location_string):
    """
    Normalize location string for database search
    
    Args:
        location_string (str): Location from resume
    
    Returns:
        list: List of possible location variations to search for
    
    Examples:
        >>> normalize_location_for_search('Bhubaneswar')
        ['bhubaneswar', 'odisha', 'bhubaneswar, odisha']
        
        >>> normalize_location_for_search('Cuttack, Odisha')
        ['cuttack', 'odisha', 'cuttack, odisha']
    """
    info = extract_location_info(location_string)
    
    variations = []
    
    if info['city']:
        variations.append(info['city'].lower())
    
    if info['state']:
        variations.append(info['state'].lower())
    
    if info['city'] and info['state']:
        variations.append(f"{info['city'].lower()}, {info['state'].lower()}")
        variations.append(f"{info['city'].lower()},{info['state'].lower()}")
    
    # Remove duplicates while preserving order
    seen = set()
    unique_variations = []
    for v in variations:
        if v not in seen:
            seen.add(v)
            unique_variations.append(v)
    
    return unique_variations


def location_matches(resume_location, search_location):
    """
    Check if resume location matches search criteria
    
    Args:
        resume_location (str): Location from resume (e.g., "Bhubaneswar", "Cuttack")
        search_location (str): Search query (e.g., "Odisha", "Bhubaneswar")
    
    Returns:
        bool: True if locations match
    
    Examples:
        >>> location_matches('Bhubaneswar', 'Odisha')
        True
        >>> location_matches('Cuttack', 'Odisha')
        True
        >>> location_matches('Bangalore', 'Karnataka')
        True
        >>> location_matches('Bangalore', 'Odisha')
        False
    """
    if not resume_location or not search_location:
        return False
    
    # Get normalized variations of both
    resume_variations = normalize_location_for_search(resume_location)
    search_variations = normalize_location_for_search(search_location)
    
    # Check if any variation matches
    for rv in resume_variations:
        for sv in search_variations:
            if rv == sv or rv in sv or sv in rv:
                return True
    
    return False


# Test the functions
if __name__ == "__main__":
    print("Testing City-State Mapping:")
    print("=" * 50)
    
    test_cities = [
        'Bhubaneswar',
        'Cuttack',
        'Bangalore',
        'Mumbai',
        'Chennai',
        'Vizag',
        'BBSR'
    ]
    
    for city in test_cities:
        state = get_state_from_city(city)
        print(f"{city:20} → {state}")
    
    print("\n" + "=" * 50)
    print("Testing Location Extraction:")
    print("=" * 50)
    
    test_locations = [
        'Bhubaneswar, Odisha',
        'Cuttack',
        'Bangalore, Karnataka',
        'Mumbai'
    ]
    
    for loc in test_locations:
        info = extract_location_info(loc)
        print(f"Input: {loc}")
        print(f"  City:  {info['city']}")
        print(f"  State: {info['state']}")
        print()
    
    print("=" * 50)
    print("Testing Location Matching:")
    print("=" * 50)
    
    test_cases = [
        ('Bhubaneswar', 'Odisha', True),
        ('Cuttack', 'Odisha', True),
        ('Bangalore', 'Karnataka', True),
        ('Bangalore', 'Odisha', False),
        ('Bhubaneswar, Odisha', 'Odisha', True),
        ('Cuttack, Odisha', 'Bhubaneswar', False),
    ]
    
    for resume_loc, search_loc, expected in test_cases:
        result = location_matches(resume_loc, search_loc)
        status = "✅" if result == expected else "❌"
        print(f"{status} '{resume_loc}' matches '{search_loc}': {result} (expected {expected})")