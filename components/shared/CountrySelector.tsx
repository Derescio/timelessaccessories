'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown, MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculateShippingByCountry } from '@/lib/utils/shipping-calculator'

// Popular countries for quick access
const POPULAR_COUNTRIES = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
]

// Extended country list
const ALL_COUNTRIES = [
    { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
    { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬' },
    { code: 'AI', name: 'Anguilla', flag: '🇦🇮' },
    { code: 'AL', name: 'Albania', flag: '🇦🇱' },
    { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
    { code: 'AO', name: 'Angola', flag: '🇦🇴' },
    { code: 'AQ', name: 'Antarctica', flag: '🇦🇶' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'AS', name: 'American Samoa', flag: '🇦🇸' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'AW', name: 'Aruba', flag: '🇦🇼' },
    { code: 'AX', name: 'Åland Islands', flag: '🇦🇽' },
    { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
    { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
    { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
    { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
    { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
    { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
    { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
    { code: 'BL', name: 'Saint Barthélemy', flag: '🇧🇱' },
    { code: 'BM', name: 'Bermuda', flag: '🇧🇲' },
    { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
    { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
    { code: 'BQ', name: 'Caribbean Netherlands', flag: '🇧🇶' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
    { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
    { code: 'BV', name: 'Bouvet Island', flag: '🇧🇻' },
    { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
    { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
    { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'CC', name: 'Cocos Islands', flag: '🇨🇨' },
    { code: 'CD', name: 'Democratic Republic of the Congo', flag: '🇨🇩' },
    { code: 'CF', name: 'Central African Republic', flag: '🇨🇫' },
    { code: 'CG', name: 'Republic of the Congo', flag: '🇨🇬' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
    { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { code: 'CK', name: 'Cook Islands', flag: '🇨🇰' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
    { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
    { code: 'CV', name: 'Cape Verde', flag: '🇨🇻' },
    { code: 'CW', name: 'Curaçao', flag: '🇨🇼' },
    { code: 'CX', name: 'Christmas Island', flag: '🇨🇽' },
    { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
    { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
    { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
    { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
    { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
    { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
    { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
    { code: 'EH', name: 'Western Sahara', flag: '🇪🇭' },
    { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮' },
    { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
    { code: 'FK', name: 'Falkland Islands', flag: '🇫🇰' },
    { code: 'FM', name: 'Micronesia', flag: '🇫🇲' },
    { code: 'FO', name: 'Faroe Islands', flag: '🇫🇴' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
    { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
    { code: 'GF', name: 'French Guiana', flag: '🇬🇫' },
    { code: 'GG', name: 'Guernsey', flag: '🇬🇬' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
    { code: 'GI', name: 'Gibraltar', flag: '🇬🇮' },
    { code: 'GL', name: 'Greenland', flag: '🇬🇱' },
    { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
    { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
    { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
    { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷' },
    { code: 'GS', name: 'South Georgia', flag: '🇬🇸' },
    { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
    { code: 'GU', name: 'Guam', flag: '🇬🇺' },
    { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
    { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
    { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
    { code: 'HM', name: 'Heard Island', flag: '🇭🇲' },
    { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
    { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
    { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
    { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
    { code: 'IL', name: 'Israel', flag: '🇮🇱' },
    { code: 'IM', name: 'Isle of Man', flag: '🇮🇲' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'IO', name: 'British Indian Ocean Territory', flag: '🇮🇴' },
    { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
    { code: 'IR', name: 'Iran', flag: '🇮🇷' },
    { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'JE', name: 'Jersey', flag: '🇯🇪' },
    { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
    { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬' },
    { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
    { code: 'KI', name: 'Kiribati', flag: '🇰🇮' },
    { code: 'KM', name: 'Comoros', flag: '🇰🇲' },
    { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
    { code: 'KP', name: 'North Korea', flag: '🇰🇵' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
    { code: 'KY', name: 'Cayman Islands', flag: '🇰🇾' },
    { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
    { code: 'LA', name: 'Laos', flag: '🇱🇦' },
    { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
    { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨' },
    { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
    { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
    { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
    { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
    { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
    { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
    { code: 'LY', name: 'Libya', flag: '🇱🇾' },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
    { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
    { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
    { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
    { code: 'MF', name: 'Saint Martin', flag: '🇲🇫' },
    { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
    { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭' },
    { code: 'MK', name: 'North Macedonia', flag: '🇲🇰' },
    { code: 'ML', name: 'Mali', flag: '🇲🇱' },
    { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
    { code: 'MN', name: 'Mongolia', flag: '🇲🇳' },
    { code: 'MO', name: 'Macao', flag: '🇲🇴' },
    { code: 'MP', name: 'Northern Mariana Islands', flag: '🇲🇵' },
    { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
    { code: 'MR', name: 'Mauritania', flag: '🇲🇷' },
    { code: 'MS', name: 'Montserrat', flag: '🇲🇸' },
    { code: 'MT', name: 'Malta', flag: '🇲🇹' },
    { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
    { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
    { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
    { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
    { code: 'NC', name: 'New Caledonia', flag: '🇳🇨' },
    { code: 'NE', name: 'Niger', flag: '🇳🇪' },
    { code: 'NF', name: 'Norfolk Island', flag: '🇳🇫' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴' },
    { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
    { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
    { code: 'NU', name: 'Niue', flag: '🇳🇺' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'OM', name: 'Oman', flag: '🇴🇲' },
    { code: 'PA', name: 'Panama', flag: '🇵🇦' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪' },
    { code: 'PF', name: 'French Polynesia', flag: '🇵🇫' },
    { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱' },
    { code: 'PM', name: 'Saint Pierre and Miquelon', flag: '🇵🇲' },
    { code: 'PN', name: 'Pitcairn', flag: '🇵🇳' },
    { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
    { code: 'PS', name: 'Palestine', flag: '🇵🇸' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'PW', name: 'Palau', flag: '🇵🇼' },
    { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
    { code: 'RE', name: 'Réunion', flag: '🇷🇪' },
    { code: 'RO', name: 'Romania', flag: '🇷🇴' },
    { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺' },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧' },
    { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
    { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'SH', name: 'Saint Helena', flag: '🇸🇭' },
    { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
    { code: 'SJ', name: 'Svalbard and Jan Mayen', flag: '🇸🇯' },
    { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
    { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
    { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
    { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
    { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
    { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
    { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
    { code: 'ST', name: 'São Tomé and Príncipe', flag: '🇸🇹' },
    { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
    { code: 'SX', name: 'Sint Maarten', flag: '🇸🇽' },
    { code: 'SY', name: 'Syria', flag: '🇸🇾' },
    { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
    { code: 'TC', name: 'Turks and Caicos Islands', flag: '🇹🇨' },
    { code: 'TD', name: 'Chad', flag: '🇹🇩' },
    { code: 'TF', name: 'French Southern Territories', flag: '🇹🇫' },
    { code: 'TG', name: 'Togo', flag: '🇹🇬' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯' },
    { code: 'TK', name: 'Tokelau', flag: '🇹🇰' },
    { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
    { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
    { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
    { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹' },
    { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
    { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
    { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
    { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
    { code: 'UM', name: 'United States Minor Outlying Islands', flag: '🇺🇲' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
    { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
    { code: 'VA', name: 'Vatican City', flag: '🇻🇦' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
    { code: 'VG', name: 'British Virgin Islands', flag: '🇻🇬' },
    { code: 'VI', name: 'U.S. Virgin Islands', flag: '🇻🇮' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
    { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },
    { code: 'WF', name: 'Wallis and Futuna', flag: '🇼🇫' },
    { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
    { code: 'YE', name: 'Yemen', flag: '🇾🇪' },
    { code: 'YT', name: 'Mayotte', flag: '🇾🇹' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
]

interface Country {
    code: string
    name: string
    flag: string
}

interface State {
    code: string
    name: string
}

interface City {
    name: string
}

interface CountrySelectorProps {
    selectedCountry: Country | null
    selectedState: State | null
    selectedCity: City | null
    onCountryChange: (country: Country | null) => void
    onStateChange: (state: State | null) => void
    onCityChange: (city: City | null) => void
    onShippingCalculated: (cost: number, countryCode: string, countryName: string) => void
    orderTotal: number
    disabled?: boolean
    showShippingCost?: boolean
}

export default function CountrySelector({
    selectedCountry,
    selectedState,
    selectedCity,
    onCountryChange,
    onStateChange,
    onCityChange,
    onShippingCalculated,
    orderTotal,
    disabled = false,
    showShippingCost = true
}: CountrySelectorProps) {
    const [open, setOpen] = useState(false)
    const [stateOpen, setStateOpen] = useState(false)
    const [cityOpen, setCityOpen] = useState(false)
    const [shippingCost, setShippingCost] = useState<number>(0)
    const [isCalculating, setIsCalculating] = useState(false)

    // Calculate shipping when country changes
    useEffect(() => {
        if (selectedCountry?.code && orderTotal > 0) {
            calculateShipping(selectedCountry.code, selectedCountry.name)
        }
    }, [selectedCountry, orderTotal])

    const calculateShipping = async (countryCode: string, countryName: string) => {
        setIsCalculating(true)
        try {
            const cost = await calculateShippingByCountry(countryCode, orderTotal)
            setShippingCost(cost)
            onShippingCalculated(cost, countryCode, countryName)
        } catch (error) {
            console.error('Error calculating shipping:', error)
            // Fallback to default rate
            const fallbackCost = 2500 // $25.00 default
            setShippingCost(fallbackCost)
            onShippingCalculated(fallbackCost, countryCode, countryName)
        } finally {
            setIsCalculating(false)
        }
    }

    const handleCountrySelect = (country: Country) => {
        onCountryChange(country)
        // Reset state and city when country changes
        onStateChange(null)
        onCityChange(null)
        setOpen(false)
    }

    // State/Province data for major countries
    const getStatesForCountry = (countryCode: string): State[] => {
        const stateData: Record<string, State[]> = {
            'US': [
                { code: 'AL', name: 'Alabama' },
                { code: 'AK', name: 'Alaska' },
                { code: 'AZ', name: 'Arizona' },
                { code: 'AR', name: 'Arkansas' },
                { code: 'CA', name: 'California' },
                { code: 'CO', name: 'Colorado' },
                { code: 'CT', name: 'Connecticut' },
                { code: 'DE', name: 'Delaware' },
                { code: 'FL', name: 'Florida' },
                { code: 'GA', name: 'Georgia' },
                { code: 'HI', name: 'Hawaii' },
                { code: 'ID', name: 'Idaho' },
                { code: 'IL', name: 'Illinois' },
                { code: 'IN', name: 'Indiana' },
                { code: 'IA', name: 'Iowa' },
                { code: 'KS', name: 'Kansas' },
                { code: 'KY', name: 'Kentucky' },
                { code: 'LA', name: 'Louisiana' },
                { code: 'ME', name: 'Maine' },
                { code: 'MD', name: 'Maryland' },
                { code: 'MA', name: 'Massachusetts' },
                { code: 'MI', name: 'Michigan' },
                { code: 'MN', name: 'Minnesota' },
                { code: 'MS', name: 'Mississippi' },
                { code: 'MO', name: 'Missouri' },
                { code: 'MT', name: 'Montana' },
                { code: 'NE', name: 'Nebraska' },
                { code: 'NV', name: 'Nevada' },
                { code: 'NH', name: 'New Hampshire' },
                { code: 'NJ', name: 'New Jersey' },
                { code: 'NM', name: 'New Mexico' },
                { code: 'NY', name: 'New York' },
                { code: 'NC', name: 'North Carolina' },
                { code: 'ND', name: 'North Dakota' },
                { code: 'OH', name: 'Ohio' },
                { code: 'OK', name: 'Oklahoma' },
                { code: 'OR', name: 'Oregon' },
                { code: 'PA', name: 'Pennsylvania' },
                { code: 'RI', name: 'Rhode Island' },
                { code: 'SC', name: 'South Carolina' },
                { code: 'SD', name: 'South Dakota' },
                { code: 'TN', name: 'Tennessee' },
                { code: 'TX', name: 'Texas' },
                { code: 'UT', name: 'Utah' },
                { code: 'VT', name: 'Vermont' },
                { code: 'VA', name: 'Virginia' },
                { code: 'WA', name: 'Washington' },
                { code: 'WV', name: 'West Virginia' },
                { code: 'WI', name: 'Wisconsin' },
                { code: 'WY', name: 'Wyoming' }
            ],
            'CA': [
                { code: 'AB', name: 'Alberta' },
                { code: 'BC', name: 'British Columbia' },
                { code: 'MB', name: 'Manitoba' },
                { code: 'NB', name: 'New Brunswick' },
                { code: 'NL', name: 'Newfoundland and Labrador' },
                { code: 'NS', name: 'Nova Scotia' },
                { code: 'ON', name: 'Ontario' },
                { code: 'PE', name: 'Prince Edward Island' },
                { code: 'QC', name: 'Quebec' },
                { code: 'SK', name: 'Saskatchewan' },
                { code: 'NT', name: 'Northwest Territories' },
                { code: 'NU', name: 'Nunavut' },
                { code: 'YT', name: 'Yukon' }
            ],
            'GB': [
                { code: 'ENG', name: 'England' },
                { code: 'SCT', name: 'Scotland' },
                { code: 'WLS', name: 'Wales' },
                { code: 'NIR', name: 'Northern Ireland' }
            ],
            'AU': [
                { code: 'NSW', name: 'New South Wales' },
                { code: 'VIC', name: 'Victoria' },
                { code: 'QLD', name: 'Queensland' },
                { code: 'WA', name: 'Western Australia' },
                { code: 'SA', name: 'South Australia' },
                { code: 'TAS', name: 'Tasmania' },
                { code: 'ACT', name: 'Australian Capital Territory' },
                { code: 'NT', name: 'Northern Territory' }
            ]
        }
        return stateData[countryCode] || []
    }

    // Major cities data for common states/provinces
    const getCitiesForState = (countryCode: string, stateCode: string): City[] => {
        const cityData: Record<string, Record<string, City[]>> = {
            'US': {
                'CA': [
                    { name: 'Los Angeles' },
                    { name: 'San Francisco' },
                    { name: 'San Diego' },
                    { name: 'Sacramento' },
                    { name: 'Oakland' },
                    { name: 'Fresno' }
                ],
                'NY': [
                    { name: 'New York City' },
                    { name: 'Buffalo' },
                    { name: 'Rochester' },
                    { name: 'Yonkers' },
                    { name: 'Syracuse' },
                    { name: 'Albany' }
                ],
                'TX': [
                    { name: 'Houston' },
                    { name: 'Dallas' },
                    { name: 'Austin' },
                    { name: 'San Antonio' },
                    { name: 'Fort Worth' },
                    { name: 'El Paso' }
                ],
                'FL': [
                    { name: 'Miami' },
                    { name: 'Orlando' },
                    { name: 'Tampa' },
                    { name: 'Jacksonville' },
                    { name: 'Fort Lauderdale' },
                    { name: 'Tallahassee' }
                ],
                'UT': [
                    { name: 'Salt Lake City' },
                    { name: 'West Valley City' },
                    { name: 'Provo' },
                    { name: 'West Jordan' },
                    { name: 'Orem' },
                    { name: 'Sandy' },
                    { name: 'Ogden' },
                    { name: 'St. George' },
                    { name: 'Layton' },
                    { name: 'Taylorsville' }
                ],
                'IL': [
                    { name: 'Chicago' },
                    { name: 'Aurora' },
                    { name: 'Naperville' },
                    { name: 'Joliet' },
                    { name: 'Rockford' },
                    { name: 'Elgin' },
                    { name: 'Peoria' },
                    { name: 'Springfield' }
                ],
                'OH': [
                    { name: 'Columbus' },
                    { name: 'Cleveland' },
                    { name: 'Cincinnati' },
                    { name: 'Toledo' },
                    { name: 'Akron' },
                    { name: 'Dayton' }
                ],
                'PA': [
                    { name: 'Philadelphia' },
                    { name: 'Pittsburgh' },
                    { name: 'Allentown' },
                    { name: 'Erie' },
                    { name: 'Reading' },
                    { name: 'Scranton' }
                ],
                'MI': [
                    { name: 'Detroit' },
                    { name: 'Grand Rapids' },
                    { name: 'Warren' },
                    { name: 'Sterling Heights' },
                    { name: 'Lansing' },
                    { name: 'Ann Arbor' }
                ],
                'GA': [
                    { name: 'Atlanta' },
                    { name: 'Augusta' },
                    { name: 'Columbus' },
                    { name: 'Savannah' },
                    { name: 'Athens' },
                    { name: 'Macon' }
                ],
                'NC': [
                    { name: 'Charlotte' },
                    { name: 'Raleigh' },
                    { name: 'Greensboro' },
                    { name: 'Durham' },
                    { name: 'Winston-Salem' },
                    { name: 'Fayetteville' }
                ],
                'NJ': [
                    { name: 'Newark' },
                    { name: 'Jersey City' },
                    { name: 'Paterson' },
                    { name: 'Elizabeth' },
                    { name: 'Edison' },
                    { name: 'Woodbridge' }
                ],
                'VA': [
                    { name: 'Virginia Beach' },
                    { name: 'Norfolk' },
                    { name: 'Chesapeake' },
                    { name: 'Richmond' },
                    { name: 'Newport News' },
                    { name: 'Alexandria' }
                ],
                'WA': [
                    { name: 'Seattle' },
                    { name: 'Spokane' },
                    { name: 'Tacoma' },
                    { name: 'Vancouver' },
                    { name: 'Bellevue' },
                    { name: 'Kent' }
                ],
                'AZ': [
                    { name: 'Phoenix' },
                    { name: 'Tucson' },
                    { name: 'Mesa' },
                    { name: 'Chandler' },
                    { name: 'Scottsdale' },
                    { name: 'Glendale' }
                ],
                'MA': [
                    { name: 'Boston' },
                    { name: 'Worcester' },
                    { name: 'Springfield' },
                    { name: 'Cambridge' },
                    { name: 'Lowell' },
                    { name: 'Brockton' }
                ],
                'IN': [
                    { name: 'Indianapolis' },
                    { name: 'Fort Wayne' },
                    { name: 'Evansville' },
                    { name: 'South Bend' },
                    { name: 'Carmel' },
                    { name: 'Fishers' }
                ],
                'TN': [
                    { name: 'Nashville' },
                    { name: 'Memphis' },
                    { name: 'Knoxville' },
                    { name: 'Chattanooga' },
                    { name: 'Clarksville' },
                    { name: 'Murfreesboro' }
                ],
                'MO': [
                    { name: 'Kansas City' },
                    { name: 'St. Louis' },
                    { name: 'Springfield' },
                    { name: 'Independence' },
                    { name: 'Columbia' },
                    { name: 'Lee\'s Summit' }
                ],
                'MD': [
                    { name: 'Baltimore' },
                    { name: 'Frederick' },
                    { name: 'Rockville' },
                    { name: 'Gaithersburg' },
                    { name: 'Bowie' },
                    { name: 'Hagerstown' }
                ],
                'WI': [
                    { name: 'Milwaukee' },
                    { name: 'Madison' },
                    { name: 'Green Bay' },
                    { name: 'Kenosha' },
                    { name: 'Racine' },
                    { name: 'Appleton' }
                ],
                'MN': [
                    { name: 'Minneapolis' },
                    { name: 'St. Paul' },
                    { name: 'Rochester' },
                    { name: 'Duluth' },
                    { name: 'Bloomington' },
                    { name: 'Brooklyn Park' }
                ],
                'CO': [
                    { name: 'Denver' },
                    { name: 'Colorado Springs' },
                    { name: 'Aurora' },
                    { name: 'Fort Collins' },
                    { name: 'Lakewood' },
                    { name: 'Thornton' }
                ],
                'AL': [
                    { name: 'Birmingham' },
                    { name: 'Montgomery' },
                    { name: 'Mobile' },
                    { name: 'Huntsville' },
                    { name: 'Tuscaloosa' },
                    { name: 'Hoover' }
                ],
                'SC': [
                    { name: 'Charleston' },
                    { name: 'Columbia' },
                    { name: 'North Charleston' },
                    { name: 'Mount Pleasant' },
                    { name: 'Rock Hill' },
                    { name: 'Greenville' }
                ],
                'LA': [
                    { name: 'New Orleans' },
                    { name: 'Baton Rouge' },
                    { name: 'Shreveport' },
                    { name: 'Lafayette' },
                    { name: 'Lake Charles' },
                    { name: 'Kenner' }
                ],
                'KY': [
                    { name: 'Louisville' },
                    { name: 'Lexington' },
                    { name: 'Bowling Green' },
                    { name: 'Owensboro' },
                    { name: 'Covington' },
                    { name: 'Richmond' }
                ],
                'OR': [
                    { name: 'Portland' },
                    { name: 'Eugene' },
                    { name: 'Salem' },
                    { name: 'Gresham' },
                    { name: 'Hillsboro' },
                    { name: 'Bend' }
                ],
                'OK': [
                    { name: 'Oklahoma City' },
                    { name: 'Tulsa' },
                    { name: 'Norman' },
                    { name: 'Broken Arrow' },
                    { name: 'Lawton' },
                    { name: 'Edmond' }
                ],
                'CT': [
                    { name: 'Bridgeport' },
                    { name: 'New Haven' },
                    { name: 'Hartford' },
                    { name: 'Stamford' },
                    { name: 'Waterbury' },
                    { name: 'Norwalk' }
                ],
                'IA': [
                    { name: 'Des Moines' },
                    { name: 'Cedar Rapids' },
                    { name: 'Davenport' },
                    { name: 'Sioux City' },
                    { name: 'Iowa City' },
                    { name: 'Waterloo' }
                ],
                'MS': [
                    { name: 'Jackson' },
                    { name: 'Gulfport' },
                    { name: 'Southaven' },
                    { name: 'Hattiesburg' },
                    { name: 'Biloxi' },
                    { name: 'Meridian' }
                ],
                'AR': [
                    { name: 'Little Rock' },
                    { name: 'Fort Smith' },
                    { name: 'Fayetteville' },
                    { name: 'Springdale' },
                    { name: 'Jonesboro' },
                    { name: 'North Little Rock' }
                ],
                'KS': [
                    { name: 'Wichita' },
                    { name: 'Overland Park' },
                    { name: 'Kansas City' },
                    { name: 'Topeka' },
                    { name: 'Olathe' },
                    { name: 'Lawrence' }
                ],
                'NV': [
                    { name: 'Las Vegas' },
                    { name: 'Henderson' },
                    { name: 'Reno' },
                    { name: 'North Las Vegas' },
                    { name: 'Sparks' },
                    { name: 'Carson City' }
                ],
                'NM': [
                    { name: 'Albuquerque' },
                    { name: 'Las Cruces' },
                    { name: 'Rio Rancho' },
                    { name: 'Santa Fe' },
                    { name: 'Roswell' },
                    { name: 'Farmington' }
                ],
                'NE': [
                    { name: 'Omaha' },
                    { name: 'Lincoln' },
                    { name: 'Bellevue' },
                    { name: 'Grand Island' },
                    { name: 'Kearney' },
                    { name: 'Fremont' }
                ],
                'WV': [
                    { name: 'Charleston' },
                    { name: 'Huntington' },
                    { name: 'Morgantown' },
                    { name: 'Parkersburg' },
                    { name: 'Wheeling' },
                    { name: 'Martinsburg' }
                ],
                'ID': [
                    { name: 'Boise' },
                    { name: 'Meridian' },
                    { name: 'Nampa' },
                    { name: 'Idaho Falls' },
                    { name: 'Pocatello' },
                    { name: 'Caldwell' }
                ],
                'HI': [
                    { name: 'Honolulu' },
                    { name: 'East Honolulu' },
                    { name: 'Pearl City' },
                    { name: 'Hilo' },
                    { name: 'Kailua' },
                    { name: 'Waipahu' }
                ],
                'NH': [
                    { name: 'Manchester' },
                    { name: 'Nashua' },
                    { name: 'Concord' },
                    { name: 'Derry' },
                    { name: 'Rochester' },
                    { name: 'Salem' }
                ],
                'ME': [
                    { name: 'Portland' },
                    { name: 'Lewiston' },
                    { name: 'Bangor' },
                    { name: 'South Portland' },
                    { name: 'Auburn' },
                    { name: 'Biddeford' }
                ],
                'MT': [
                    { name: 'Billings' },
                    { name: 'Missoula' },
                    { name: 'Great Falls' },
                    { name: 'Bozeman' },
                    { name: 'Butte' },
                    { name: 'Helena' }
                ],
                'RI': [
                    { name: 'Providence' },
                    { name: 'Warwick' },
                    { name: 'Cranston' },
                    { name: 'Pawtucket' },
                    { name: 'East Providence' },
                    { name: 'Woonsocket' }
                ],
                'DE': [
                    { name: 'Wilmington' },
                    { name: 'Dover' },
                    { name: 'Newark' },
                    { name: 'Middletown' },
                    { name: 'Smyrna' },
                    { name: 'Milford' }
                ],
                'SD': [
                    { name: 'Sioux Falls' },
                    { name: 'Rapid City' },
                    { name: 'Aberdeen' },
                    { name: 'Brookings' },
                    { name: 'Watertown' },
                    { name: 'Mitchell' }
                ],
                'ND': [
                    { name: 'Fargo' },
                    { name: 'Bismarck' },
                    { name: 'Grand Forks' },
                    { name: 'Minot' },
                    { name: 'West Fargo' },
                    { name: 'Williston' }
                ],
                'AK': [
                    { name: 'Anchorage' },
                    { name: 'Fairbanks' },
                    { name: 'Juneau' },
                    { name: 'Sitka' },
                    { name: 'Ketchikan' },
                    { name: 'Wasilla' }
                ],
                'VT': [
                    { name: 'Burlington' },
                    { name: 'Essex' },
                    { name: 'South Burlington' },
                    { name: 'Colchester' },
                    { name: 'Rutland' },
                    { name: 'Montpelier' }
                ],
                'WY': [
                    { name: 'Cheyenne' },
                    { name: 'Casper' },
                    { name: 'Laramie' },
                    { name: 'Gillette' },
                    { name: 'Rock Springs' },
                    { name: 'Sheridan' }
                ]
            },
            'CA': {
                'ON': [
                    { name: 'Toronto' },
                    { name: 'Ottawa' },
                    { name: 'Hamilton' },
                    { name: 'London' },
                    { name: 'Kitchener' },
                    { name: 'Windsor' }
                ],
                'BC': [
                    { name: 'Vancouver' },
                    { name: 'Victoria' },
                    { name: 'Surrey' },
                    { name: 'Burnaby' },
                    { name: 'Richmond' },
                    { name: 'Abbotsford' }
                ],
                'QC': [
                    { name: 'Montreal' },
                    { name: 'Quebec City' },
                    { name: 'Laval' },
                    { name: 'Gatineau' },
                    { name: 'Longueuil' },
                    { name: 'Sherbrooke' }
                ],
                'MB': [
                    { name: 'Winnipeg' },
                    { name: 'Brandon' },
                    { name: 'Steinbach' },
                    { name: 'Thompson' },
                    { name: 'Portage la Prairie' },
                    { name: 'Winkler' },
                    { name: 'Selkirk' },
                    { name: 'Morden' },
                    { name: 'Dauphin' },
                    { name: 'The Pas' }
                ],
                'AB': [
                    { name: 'Calgary' },
                    { name: 'Edmonton' },
                    { name: 'Red Deer' },
                    { name: 'Lethbridge' },
                    { name: 'Medicine Hat' },
                    { name: 'Grande Prairie' },
                    { name: 'Airdrie' },
                    { name: 'Spruce Grove' },
                    { name: 'Leduc' },
                    { name: 'Lloydminster' }
                ],
                'SK': [
                    { name: 'Saskatoon' },
                    { name: 'Regina' },
                    { name: 'Prince Albert' },
                    { name: 'Moose Jaw' },
                    { name: 'Swift Current' },
                    { name: 'Yorkton' },
                    { name: 'North Battleford' },
                    { name: 'Estevan' },
                    { name: 'Weyburn' },
                    { name: 'Lloydminster' }
                ],
                'NB': [
                    { name: 'Moncton' },
                    { name: 'Saint John' },
                    { name: 'Fredericton' },
                    { name: 'Dieppe' },
                    { name: 'Riverview' },
                    { name: 'Edmundston' },
                    { name: 'Miramichi' },
                    { name: 'Bathurst' },
                    { name: 'Campbellton' },
                    { name: 'Caraquet' }
                ],
                'NS': [
                    { name: 'Halifax' },
                    { name: 'Sydney' },
                    { name: 'Dartmouth' },
                    { name: 'Truro' },
                    { name: 'New Glasgow' },
                    { name: 'Glace Bay' },
                    { name: 'Kentville' },
                    { name: 'Amherst' },
                    { name: 'Yarmouth' },
                    { name: 'Bridgewater' }
                ],
                'NL': [
                    { name: 'St. John\'s' },
                    { name: 'Mount Pearl' },
                    { name: 'Corner Brook' },
                    { name: 'Conception Bay South' },
                    { name: 'Paradise' },
                    { name: 'Grand Falls-Windsor' },
                    { name: 'Happy Valley-Goose Bay' },
                    { name: 'Gander' },
                    { name: 'Labrador City' },
                    { name: 'Stephenville' }
                ],
                'PE': [
                    { name: 'Charlottetown' },
                    { name: 'Summerside' },
                    { name: 'Stratford' },
                    { name: 'Cornwall' },
                    { name: 'Montague' },
                    { name: 'Kensington' },
                    { name: 'Souris' },
                    { name: 'Alberton' },
                    { name: 'Georgetown' },
                    { name: 'Tignish' }
                ],
                'NT': [
                    { name: 'Yellowknife' },
                    { name: 'Hay River' },
                    { name: 'Inuvik' },
                    { name: 'Fort Smith' },
                    { name: 'Behchokǫ̀' },
                    { name: 'Norman Wells' }
                ],
                'NU': [
                    { name: 'Iqaluit' },
                    { name: 'Rankin Inlet' },
                    { name: 'Arviat' },
                    { name: 'Baker Lake' },
                    { name: 'Igloolik' },
                    { name: 'Pangnirtung' }
                ],
                'YT': [
                    { name: 'Whitehorse' },
                    { name: 'Dawson City' },
                    { name: 'Watson Lake' },
                    { name: 'Haines Junction' },
                    { name: 'Mayo' },
                    { name: 'Carmacks' }
                ]
            },
            'GB': {
                'ENG': [
                    { name: 'London' },
                    { name: 'Manchester' },
                    { name: 'Birmingham' },
                    { name: 'Liverpool' },
                    { name: 'Leeds' },
                    { name: 'Sheffield' }
                ],
                'SCT': [
                    { name: 'Glasgow' },
                    { name: 'Edinburgh' },
                    { name: 'Aberdeen' },
                    { name: 'Dundee' },
                    { name: 'Stirling' },
                    { name: 'Perth' }
                ]
            },
            'AU': {
                'NSW': [
                    { name: 'Sydney' },
                    { name: 'Newcastle' },
                    { name: 'Wollongong' },
                    { name: 'Canberra' },
                    { name: 'Central Coast' },
                    { name: 'Maitland' }
                ],
                'VIC': [
                    { name: 'Melbourne' },
                    { name: 'Geelong' },
                    { name: 'Ballarat' },
                    { name: 'Bendigo' },
                    { name: 'Shepparton' },
                    { name: 'Wodonga' }
                ]
            }
        }
        return cityData[countryCode]?.[stateCode] || []
    }

    const availableStates = selectedCountry ? getStatesForCountry(selectedCountry.code) : []
    const availableCities = selectedCountry && selectedState ? getCitiesForState(selectedCountry.code, selectedState.code) : []

    return (
        <div className="space-y-3">
            <div>
                <Label htmlFor="country" className="text-sm font-medium">
                    Country/Region *
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between h-10 px-3"
                            disabled={disabled}
                        >
                            {selectedCountry ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{selectedCountry.flag}</span>
                                    <span className="truncate">{selectedCountry.name}</span>
                                </div>
                            ) : (
                                <span className="text-muted-foreground">Select country...</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search countries..." className="h-9" />
                            <CommandEmpty>No country found.</CommandEmpty>

                            {/* Popular Countries */}
                            <CommandGroup heading="Popular Countries">
                                {POPULAR_COUNTRIES.map((country) => (
                                    <CommandItem
                                        key={country.code}
                                        value={`${country.name} ${country.code}`}
                                        onSelect={() => handleCountrySelect(country)}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-lg">{country.flag}</span>
                                            <span>{country.name}</span>
                                        </div>
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                selectedCountry?.code === country.code
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>

                            {/* All Countries */}
                            <CommandGroup heading="All Countries">
                                {ALL_COUNTRIES.filter(country =>
                                    !POPULAR_COUNTRIES.some(popular => popular.code === country.code)
                                ).map((country) => (
                                    <CommandItem
                                        key={country.code}
                                        value={`${country.name} ${country.code}`}
                                        onSelect={() => handleCountrySelect(country)}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-lg">{country.flag}</span>
                                            <span>{country.name}</span>
                                        </div>
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                selectedCountry?.code === country.code
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* State/Province Selection */}
            {selectedCountry && availableStates.length > 0 && (
                <div>
                    <Label htmlFor="state" className="text-sm font-medium">
                        State/Province
                    </Label>
                    <Popover open={stateOpen} onOpenChange={setStateOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between h-10 px-3"
                                disabled={disabled}
                            >
                                {selectedState ? (
                                    <span className="truncate">{selectedState.name}</span>
                                ) : (
                                    <span className="text-muted-foreground">Select state/province...</span>
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search states..." className="h-9" />
                                <CommandEmpty>No state found.</CommandEmpty>
                                <CommandGroup>
                                    {availableStates.map((state) => (
                                        <CommandItem
                                            key={state.code}
                                            value={state.name}
                                            onSelect={() => {
                                                onStateChange(state)
                                                onCityChange(null) // Reset city when state changes
                                                setStateOpen(false) // Close dropdown
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <span>{state.name}</span>
                                            <Check
                                                className={cn(
                                                    "ml-auto h-4 w-4",
                                                    selectedState?.code === state.code
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            {/* City Selection */}
            {selectedCountry && selectedState && availableCities.length > 0 && (
                <div>
                    <Label htmlFor="city" className="text-sm font-medium">
                        City
                    </Label>
                    <Popover open={cityOpen} onOpenChange={setCityOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between h-10 px-3"
                                disabled={disabled}
                            >
                                {selectedCity ? (
                                    <span className="truncate">{selectedCity.name}</span>
                                ) : (
                                    <span className="text-muted-foreground">Select city...</span>
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search cities..." className="h-9" />
                                <CommandEmpty>No city found.</CommandEmpty>
                                <CommandGroup>
                                    {availableCities.map((city) => (
                                        <CommandItem
                                            key={city.name}
                                            value={city.name}
                                            onSelect={() => {
                                                onCityChange(city)
                                                setCityOpen(false) // Close dropdown
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <span>{city.name}</span>
                                            <Check
                                                className={cn(
                                                    "ml-auto h-4 w-4",
                                                    selectedCity?.name === city.name
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            {/* Shipping Cost Display */}
            {showShippingCost && selectedCountry && (
                <div className="bg-muted/50 p-3 rounded-md border">
                    <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Shipping to {selectedCountry.name}</span>
                    </div>

                    {isCalculating ? (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Calculating shipping cost...</span>
                        </div>
                    ) : (
                        <div className="mt-2 space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Shipping cost:</span>
                                <span className="font-medium">
                                    {shippingCost === 0 ? 'FREE' : `$${(shippingCost / 100).toFixed(2)}`}
                                </span>
                            </div>
                            {shippingCost === 0 && orderTotal >= 40000 && (
                                <div className="flex items-center gap-1 text-sm text-green-600">
                                    <Check className="h-3 w-3" />
                                    <span>Free shipping applied!</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
} 