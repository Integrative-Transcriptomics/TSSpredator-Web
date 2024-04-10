import pandas as pd

def join_tsv_files(file_enriched, file_normal):
    df1 = pd.read_csv(file_enriched, sep='\t')
    df2 = pd.read_csv(file_normal, sep='\t')
    
    # Get all unique start and end points
    breakpoints_start = sorted(df1[['start']].stack()._append(df2[['start']].stack()).unique())
    breakpoints_end = sorted(df1[['end']].stack()._append(df2[['end']].stack()).unique())

    # Create new intervals
    intervals = pd.DataFrame({'start': breakpoints_start, 'end': breakpoints_end})

    # Merge the intervals with the original dataframes
    result = pd.merge_asof(intervals, df1, left_on='start', right_on='start', direction='backward', suffixes=('', '_df1'))
    result = pd.merge_asof(result, df2, left_on='start', right_on='start', direction='backward', suffixes=('', '_df2'))
    # drop unnecessary columns
    result = result.drop(columns=['end_df1', 'end_df2'])
    # rename columns
    result = result.rename(columns={'value': 'value_enriched', 'value_df2': 'value_normal'})
    return result

def stackWiggle(df):
    # Stack the df so that instead of start,end,value_enriched,value_normal we have position, value_enriched, value_normal
    df["tmpIndex"] = df.index
    df = df.set_index(['tmpIndex', 'value_enriched', 'value_normal'])[['start', "end"]].stack().reset_index()
    df = df.rename(columns={0: 'position'})
    df = df.drop(columns=['level_3', 'tmpIndex'])   
    return df

# Example usage
result_df = join_tsv_files('/var/folders/1n/xbwg0k_91bs2lc1hp8gksr1m0000gn/T/tmpPredZippedResultwe7vmtrw/NC_008787_superFivePrimeMinus_avg.bigwig', 
                           '/var/folders/1n/xbwg0k_91bs2lc1hp8gksr1m0000gn/T/tmpPredZippedResultwe7vmtrw/NC_008787_superNormalMinus_avg.bigwig') 

print(result_df)
print(stackWiggle(result_df))

