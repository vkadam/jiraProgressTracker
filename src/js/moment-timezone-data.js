define(['moment-timezone'], function(moment) {
    moment.tz.add({
        'zones': {
            'America/Detroit': [
                '-5:32:11 - LMT 1905 -5:32:11',
                '-6 - CST 1915_4_15_2 -6',
                '-5 - EST 1942 -5',
                '-5 US E%sT 1946 -5',
                '-5 Detroit E%sT 1973 -5',
                '-5 US E%sT 1975 -5',
                '-5 - EST 1975_3_27_2 -5',
                '-5 US E%sT'
            ]
        },
        'rules': {
            'US': [
                '1918 1919 2 0 8 2 0 1 D',
                '1918 1919 9 0 8 2 0 0 S',
                '1942 1942 1 9 7 2 0 1 W',
                '1945 1945 7 14 7 23 1 1 P',
                '1945 1945 8 30 7 2 0 0 S',
                '1967 2006 9 0 8 2 0 0 S',
                '1967 1973 3 0 8 2 0 1 D',
                '1974 1974 0 6 7 2 0 1 D',
                '1975 1975 1 23 7 2 0 1 D',
                '1976 1986 3 0 8 2 0 1 D',
                '1987 2006 3 1 0 2 0 1 D',
                '2007 9999 2 8 0 2 0 1 D',
                '2007 9999 10 1 0 2 0 0 S'
            ],
            'Detroit': [
                '1948 1948 3 0 8 2 0 1 D',
                '1948 1948 8 0 8 2 0 0 S',
                '1967 1967 5 14 7 2 0 1 D',
                '1967 1967 9 0 8 2 0 0 S'
            ]
        },
        'links': {}
    });
});
